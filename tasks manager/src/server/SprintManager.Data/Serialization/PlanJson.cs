using System.Text.Json;
using System.Text.Json.Serialization;
using SprintManager.Core.Domain;
using SprintManager.Core.Planning;

namespace SprintManager.Data.Serialization;

/// <summary>
/// JSON (de)serialisation of <see cref="SprintPlan"/> for storage. The plan is a deep tree of Core records;
/// storing it as one JSON string keeps the BSON mapping simple and the Core types free of database attributes.
/// </summary>
public static class PlanJson
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new MemberIdConverter(), new TaskIdConverter(), new HoursConverter(), new JsonStringEnumConverter() },
    };

    /// <summary>Serialises a plan.</summary>
    public static string Serialize(SprintPlan plan) => JsonSerializer.Serialize(plan, Options);

    /// <summary>Deserialises a plan.</summary>
    public static SprintPlan Deserialize(string json) =>
        JsonSerializer.Deserialize<SprintPlan>(json, Options) ?? throw new InvalidOperationException("Stored plan is empty.");

    /// <summary>Writes the id as a plain GUID string, also usable as a dictionary key.</summary>
    private sealed class MemberIdConverter : JsonConverter<MemberId>
    {
        public override MemberId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) => new(reader.GetGuid());
        public override void Write(Utf8JsonWriter writer, MemberId value, JsonSerializerOptions options) => writer.WriteStringValue(value.Value);
        public override MemberId ReadAsPropertyName(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) => new(Guid.Parse(reader.GetString()!));
        public override void WriteAsPropertyName(Utf8JsonWriter writer, MemberId value, JsonSerializerOptions options) => writer.WritePropertyName(value.Value.ToString());
    }

    /// <summary>
    /// Writes hours as a plain number. Without this, System.Text.Json uses the implicit parameterless struct
    /// constructor for <see cref="Hours"/> and every value silently comes back as 0 (the validating constructor is ignored).
    /// </summary>
    private sealed class HoursConverter : JsonConverter<Hours>
    {
        public override Hours Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) => new(reader.GetDouble());
        public override void Write(Utf8JsonWriter writer, Hours value, JsonSerializerOptions options) => writer.WriteNumberValue(value.Value);
    }

    /// <summary>Writes the id as a plain GUID string.</summary>
    private sealed class TaskIdConverter : JsonConverter<TaskId>
    {
        public override TaskId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) => new(reader.GetGuid());
        public override void Write(Utf8JsonWriter writer, TaskId value, JsonSerializerOptions options) => writer.WriteStringValue(value.Value);
    }
}
