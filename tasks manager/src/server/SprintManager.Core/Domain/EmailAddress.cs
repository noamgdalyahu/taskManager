namespace SprintManager.Core.Domain;

/// <summary>A syntactically plausible, lower-cased email address.</summary>
public readonly record struct EmailAddress
{
    /// <summary>Normalised value.</summary>
    public string Value { get; }

    /// <summary>Validates and normalises.</summary>
    /// <exception cref="ArgumentException">Empty or missing '@' / '.'.</exception>
    public EmailAddress(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Email cannot be empty.", nameof(value));

        var trimmed = value.Trim();
        var at = trimmed.IndexOf('@');
        if (at <= 0 || at == trimmed.Length - 1 || trimmed.IndexOf('.', at) < 0 || trimmed.Length > 254)
            throw new ArgumentException($"Invalid email format: {value}", nameof(value));

        Value = trimmed.ToLowerInvariant();
    }

    /// <summary>Tries to parse without throwing.</summary>
    public static bool TryParse(string? value, out EmailAddress email)
    {
        try
        {
            email = new EmailAddress(value ?? string.Empty);
            return true;
        }
        catch (ArgumentException)
        {
            email = default;
            return false;
        }
    }

    /// <inheritdoc />
    public override string ToString() => Value;
}
