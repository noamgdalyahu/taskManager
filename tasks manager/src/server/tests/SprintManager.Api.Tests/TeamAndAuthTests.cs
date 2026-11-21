using SprintManager.Api.Controllers.Auth;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Controllers.Team;
using SprintManager.Api.Options;
using SprintManager.Api.Security;
using SprintManager.Api.Tests.Support;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Tests;

public class TeamAndAuthTests
{
    private readonly World w = new();
    private static readonly CancellationToken Ct = CancellationToken.None;

    // ---- invitations ----------------------------------------------------------

    [Fact]
    public async Task Manager_Invites_OutsiderJoins_BecomesMember()
    {
        var invite = (await w.TeamService.InviteAsync(w.Project.Id, new InviteRequest(null), w.AsMia, Ct)).Value!;

        var joined = await w.TeamService.JoinAsync(new JoinRequest(invite.Code), w.AsOz, Ct);

        Assert.True(joined.IsSuccess);
        Assert.Contains(w.Oz.Id, w.Projects.Items[w.Project.Id].MemberIds);
        Assert.Equal(w.Oz.Id, w.Invitations.Items[invite.Code].UsedBy);
    }

    [Fact]
    public async Task Code_CannotBeUsedTwice()
    {
        var invite = (await w.TeamService.InviteAsync(w.Project.Id, new InviteRequest(null), w.AsMia, Ct)).Value!;
        await w.TeamService.JoinAsync(new JoinRequest(invite.Code), w.AsOz, Ct);
        var other = w.AddUser("zed@t.com", "Zed", UserRole.Member);

        var second = await w.TeamService.JoinAsync(new JoinRequest(invite.Code), new CurrentUser(other.Id, UserRole.Member), Ct);

        Assert.Equal(ErrorKind.NotFound, second.Error!.Value.Kind);
    }

    [Fact]
    public async Task ExpiredCode_IsRejected()
    {
        var invite = (await w.TeamService.InviteAsync(w.Project.Id, new InviteRequest(null, ExpiresInDays: 1), w.AsMia, Ct)).Value!;
        w.Clock.Advance(TimeSpan.FromDays(2));

        var result = await w.TeamService.JoinAsync(new JoinRequest(invite.Code), w.AsOz, Ct);

        Assert.Equal(ErrorKind.NotFound, result.Error!.Value.Kind);
    }

    [Fact]
    public async Task EmailRestrictedCode_RejectsOtherEmail()
    {
        var invite = (await w.TeamService.InviteAsync(w.Project.Id, new InviteRequest("someone.else@t.com"), w.AsMia, Ct)).Value!;

        var result = await w.TeamService.JoinAsync(new JoinRequest(invite.Code), w.AsOz, Ct);

        Assert.Equal(ErrorKind.Forbidden, result.Error!.Value.Kind);
        Assert.DoesNotContain(w.Oz.Id, w.Projects.Items[w.Project.Id].MemberIds);
    }

    [Fact]
    public async Task Member_CannotInvite()
    {
        var result = await w.TeamService.InviteAsync(w.Project.Id, new InviteRequest(null), w.AsDan, Ct);

        Assert.Equal(ErrorKind.Forbidden, result.Error!.Value.Kind);
    }

    [Fact]
    public async Task Codes_AreEightUnambiguousCharacters()
    {
        var codes = new HashSet<string>();
        for (var i = 0; i < 50; i++)
            codes.Add((await w.TeamService.InviteAsync(w.Project.Id, new InviteRequest(null), w.AsMia, Ct)).Value!.Code);

        Assert.Equal(50, codes.Count);
        Assert.All(codes, c =>
        {
            Assert.Equal(8, c.Length);
            Assert.DoesNotContain(c, ch => "01OIl".Contains(ch));
        });
    }

    [Fact]
    public async Task Owner_CannotBeRemoved_OthersCan()
    {
        var owner = await w.TeamService.RemoveMemberAsync(w.Project.Id, w.Mia.Id, w.AsMia, Ct);
        Assert.Equal(ErrorKind.Conflict, owner.Error!.Value.Kind);

        var dan = await w.TeamService.RemoveMemberAsync(w.Project.Id, w.Dan.Id, w.AsMia, Ct);
        Assert.True(dan.IsSuccess);
        Assert.DoesNotContain(w.Dan.Id, w.Projects.Items[w.Project.Id].MemberIds);
    }

    [Fact]
    public async Task RemovedMember_LosesAccessImmediately()
    {
        var task = w.AddTask("T");
        await w.TeamService.RemoveMemberAsync(w.Project.Id, w.Dan.Id, w.AsMia, Ct);

        var result = await w.TaskService.GetDetailAsync(task.Id, w.AsDan, Ct);

        Assert.Equal(ErrorKind.NotFound, result.Error!.Value.Kind);
    }

    // ---- authentication -----------------------------------------------------------

    private AuthService Auth()
    {
        var options = Microsoft.Extensions.Options.Options.Create(new JwtOptions { Issuer = "t", Audience = "t", SigningKey = new string('k', 40) });
        return w.AuthService(new JwtTokenService(options, w.Clock));
    }

    [Fact]
    public async Task Register_StoresHashNotPassword_AndReturnsToken()
    {
        var result = await Auth().RegisterAsync(new RegisterRequest("New@T.com", "Passw0rd!", " New ", UserRole.Member), Ct);

        Assert.True(result.IsSuccess);
        Assert.False(string.IsNullOrEmpty(result.Response!.AccessToken));
        var stored = w.Users.Items.Values.Single(u => u.Name == "New");
        Assert.Equal("new@t.com", stored.Email.Value);          // normalised
        Assert.NotEqual("Passw0rd!", stored.PasswordHash);      // never plaintext
    }

    [Fact]
    public async Task Register_DuplicateEmail_CaseInsensitive_Conflicts()
    {
        var result = await Auth().RegisterAsync(new RegisterRequest("MIA@t.com", "Passw0rd!", "Again", UserRole.Member), Ct);

        Assert.Equal(AuthErrorCode.EmailTaken, result.Error);
    }

    [Fact]
    public async Task Login_WrongPasswordAndUnknownEmail_LookIdentical()
    {
        var wrong = await Auth().LoginAsync(new LoginRequest("mia@t.com", "nope"), Ct);
        var unknown = await Auth().LoginAsync(new LoginRequest("ghost@t.com", "Passw0rd!"), Ct);

        Assert.Equal(AuthErrorCode.InvalidCredentials, wrong.Error);
        Assert.Equal(wrong.Error, unknown.Error);   // no user enumeration
    }

    [Fact]
    public async Task Login_CorrectPassword_Succeeds()
    {
        var result = await Auth().LoginAsync(new LoginRequest("MIA@t.com", "Passw0rd!"), Ct);

        Assert.True(result.IsSuccess);
        Assert.Equal(UserRole.Manager, result.Response!.User.Role);
    }

    [Fact]
    public async Task Refresh_GivesTheSamePersonANewTokenThatLastsLonger()
    {
        var auth = Auth();
        var first = await auth.LoginAsync(new LoginRequest("MIA@t.com", "Passw0rd!"), Ct);

        w.Clock.Advance(TimeSpan.FromMinutes(45));
        var refreshed = await auth.RefreshAsync(new CurrentUser(w.Mia.Id, UserRole.Manager), Ct);

        Assert.True(refreshed.IsSuccess);
        Assert.Equal(first.Response!.User.Id, refreshed.Response!.User.Id);
        Assert.True(refreshed.Response.ExpiresAt > first.Response.ExpiresAt);
        Assert.NotEqual(first.Response.AccessToken, refreshed.Response.AccessToken);
    }

    [Fact]
    public async Task Refresh_ForSomeoneWhoNoLongerExists_IsRefused()
    {
        var result = await Auth().RefreshAsync(new CurrentUser(MemberId.New(), UserRole.Member), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(AuthErrorCode.InvalidCredentials, result.Error);
    }

    [Fact]
    public void RealHasher_RoundTrips_UsesFreshSalt_RejectsTampering()
    {
        var hasher = new Pbkdf2PasswordHasher();

        var one = hasher.Hash("Passw0rd!");
        var two = hasher.Hash("Passw0rd!");

        Assert.NotEqual(one, two);                       // random salt
        Assert.StartsWith("pbkdf2-sha256$", one);
        Assert.True(hasher.Verify("Passw0rd!", one));
        Assert.False(hasher.Verify("passw0rd!", one));
        Assert.False(hasher.Verify("Passw0rd!", one[..^4] + "AAAA"));
        Assert.False(hasher.Verify("Passw0rd!", "garbage"));
    }
}
