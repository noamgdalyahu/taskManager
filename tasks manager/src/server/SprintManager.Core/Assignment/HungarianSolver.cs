namespace SprintManager.Core.Assignment;

/// <summary>
/// Hungarian algorithm (Kuhn–Munkres) for the rectangular assignment problem:
/// given <c>cost[row][col]</c> with rows ≤ cols, pick one distinct column per row
/// minimising the total cost.
/// </summary>
/// <remarks>
/// This is the O(n²·m) potentials formulation (Jonker-style), the version taught in competitive
/// programming references. Intuition:
/// <list type="bullet">
/// <item>Keep a "potential" u[row], v[col] such that u[row] + v[col] ≤ cost[row][col] for every pair
/// (a lower bound on how cheap any pair can be).</item>
/// <item>A pair is <i>tight</i> when equality holds. Matching only along tight pairs guarantees optimality
/// (this is LP duality: the potentials are the dual solution).</item>
/// <item>Rows are added one at a time. For each new row, run a shortest-augmenting-path search over tight
/// edges using <c>minv</c> (the slack to each column). When the search is stuck, raise/lower potentials
/// by the smallest slack <c>delta</c>, which makes at least one new edge tight, and continue.</item>
/// <item>When a free column is reached, flip the alternating path (<c>way</c>) to grow the matching by one.</item>
/// </list>
/// Columns with cost <see cref="double.PositiveInfinity"/> are treated as a very large finite number so the
/// search never stalls; callers must check whether such a pair ended up chosen (it means infeasible).
/// <para>Time: O(rows² × cols). Space: O(rows + cols).</para>
/// </remarks>
public static class HungarianSolver
{
    /// <summary>Stand-in for infinity inside the arithmetic (large but finite, keeps subtraction stable).</summary>
    public const double Forbidden = 1e9;

    /// <summary>
    /// Solves the assignment. Returns <c>columnOfRow[row]</c>; every row receives a distinct column.
    /// </summary>
    /// <param name="cost">Rectangular matrix, rows ≤ cols. Infinity marks forbidden pairs.</param>
    /// <exception cref="ArgumentException">More rows than columns, or a ragged matrix.</exception>
    public static int[] Solve(double[][] cost)
    {
        ArgumentNullException.ThrowIfNull(cost);
        var rows = cost.Length;
        if (rows == 0)
            return [];

        var cols = cost[0].Length;
        if (rows > cols)
            throw new ArgumentException("Hungarian needs rows <= cols; pad with dummy columns first.", nameof(cost));
        if (cost.Any(r => r.Length != cols))
            throw new ArgumentException("All rows must have the same length.", nameof(cost));

        // 1-based arrays, index 0 is a sentinel ("no row" / "no column").
        var u = new double[rows + 1];
        var v = new double[cols + 1];
        var rowOfCol = new int[cols + 1];   // p[j]: row currently matched to column j (0 = free)
        var way = new int[cols + 1];        // previous column on the alternating path

        for (var i = 1; i <= rows; i++)
        {
            rowOfCol[0] = i;
            var j0 = 0;                       // column we are currently exploring from (0 = virtual start)
            var minv = new double[cols + 1];  // smallest slack seen to each column
            Array.Fill(minv, double.PositiveInfinity);
            var used = new bool[cols + 1];    // columns already in the search tree

            do
            {
                used[j0] = true;
                var i0 = rowOfCol[j0];
                var delta = double.PositiveInfinity;
                var j1 = 0;

                // Relax: from row i0, look at every column not yet in the tree.
                for (var j = 1; j <= cols; j++)
                {
                    if (used[j])
                        continue;

                    var cur = Clamp(cost[i0 - 1][j - 1]) - u[i0] - v[j];  // slack of edge (i0, j)
                    if (cur < minv[j])
                    {
                        minv[j] = cur;
                        way[j] = j0;
                    }
                    if (minv[j] < delta)
                    {
                        delta = minv[j];
                        j1 = j;
                    }
                }

                // Update potentials: tree columns and their rows shift by delta, others lose delta of slack.
                for (var j = 0; j <= cols; j++)
                {
                    if (used[j])
                    {
                        u[rowOfCol[j]] += delta;
                        v[j] -= delta;
                    }
                    else
                    {
                        minv[j] -= delta;
                    }
                }

                j0 = j1;
            }
            while (rowOfCol[j0] != 0);        // stop when we reach a free column

            // Augment: walk back along 'way' and flip the matching.
            do
            {
                var j1 = way[j0];
                rowOfCol[j0] = rowOfCol[j1];
                j0 = j1;
            }
            while (j0 != 0);
        }

        var columnOfRow = new int[rows];
        for (var j = 1; j <= cols; j++)
        {
            if (rowOfCol[j] != 0)
                columnOfRow[rowOfCol[j] - 1] = j - 1;
        }
        return columnOfRow;
    }

    private static double Clamp(double c) => double.IsPositiveInfinity(c) ? Forbidden : c;
}
