namespace SprintManager.Core.Domain;

/// <summary>A non-negative amount of work time, in hours.</summary>
/// <remarks>
/// Validated once at construction so every algorithm can trust the value
/// (no negative estimates leaking into the critical path arithmetic).
/// </remarks>
public readonly record struct Hours
{
    /// <summary>Zero hours.</summary>
    public static readonly Hours Zero = new(0);

    /// <summary>The numeric value in hours.</summary>
    public double Value { get; }

    /// <summary>Creates an <see cref="Hours"/> value.</summary>
    /// <exception cref="ArgumentOutOfRangeException">Value is negative or not a finite number.</exception>
    public Hours(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value) || value < 0)
            throw new ArgumentOutOfRangeException(nameof(value), value, "Hours must be a finite, non-negative number.");

        Value = value;
    }

    /// <summary>Adds two durations.</summary>
    public static Hours operator +(Hours a, Hours b) => new(a.Value + b.Value);

    /// <summary>Compares two durations.</summary>
    public static bool operator >(Hours a, Hours b) => a.Value > b.Value;

    /// <summary>Compares two durations.</summary>
    public static bool operator <(Hours a, Hours b) => a.Value < b.Value;

    /// <inheritdoc />
    public override string ToString() => $"{Value:0.##}h";
}
