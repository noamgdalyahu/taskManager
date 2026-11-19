namespace SprintManager.Core.Domain;

/// <summary>Proficiency level in a skill, 1 (beginner) to 5 (expert).</summary>
public readonly record struct SkillLevel
{
    /// <summary>Lowest level.</summary>
    public const int Min = 1;
    /// <summary>Highest level.</summary>
    public const int Max = 5;

    /// <summary>Numeric level.</summary>
    public int Value { get; }

    /// <summary>Creates a level.</summary>
    /// <exception cref="ArgumentOutOfRangeException">Outside 1..5.</exception>
    public SkillLevel(int value)
    {
        if (value is < Min or > Max)
            throw new ArgumentOutOfRangeException(nameof(value), value, $"Skill level must be between {Min} and {Max}.");
        Value = value;
    }

    /// <summary>Normalised gap to expert: 0 for level 5, 1 for level 1.</summary>
    public double GapToExpert => (Max - Value) / (double)(Max - Min);

    /// <inheritdoc />
    public override string ToString() => Value.ToString();
}

/// <summary>The algorithmic view of a team member: what the assignment needs to know.</summary>
/// <param name="Id">Member id.</param>
/// <param name="Name">Display name used in reasons and warnings.</param>
/// <param name="Skills">Skill name (case-insensitive) to level.</param>
/// <param name="Capacity">Hours available in the sprint.</param>
public sealed record Member(
    MemberId Id,
    string Name,
    IReadOnlyDictionary<string, SkillLevel> Skills,
    Hours Capacity)
{
    /// <summary>Creates a member from a simple skill list.</summary>
    public static Member Create(MemberId id, string name, Hours capacity, params (string Skill, int Level)[] skills) =>
        new(id, name,
            skills.ToDictionary(s => s.Skill, s => new SkillLevel(s.Level), StringComparer.OrdinalIgnoreCase),
            capacity);

    /// <summary>Level in a skill, or null when the member lacks it.</summary>
    public SkillLevel? LevelIn(string skill) =>
        Skills.TryGetValue(skill, out var level) ? level : null;

    /// <summary>True when the member has every required skill (at any level).</summary>
    public bool HasAll(IReadOnlyList<string> requiredSkills)
    {
        foreach (var skill in requiredSkills)
        {
            if (!Skills.ContainsKey(skill))
                return false;
        }
        return true;
    }
}
