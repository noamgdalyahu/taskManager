using SprintManager.Core.Assignment;

namespace SprintManager.Core.Tests.Assignment;

public class HungarianSolverTests
{
    [Fact]
    public void Empty_ReturnsEmpty()
    {
        Assert.Empty(HungarianSolver.Solve([]));
    }

    [Fact]
    public void Square_KnownOptimum()
    {
        // Classic example: optimum is 0->1, 1->0, 2->2 with cost 1+2+3 = 6... let's use a clear one.
        double[][] cost =
        [
            [4, 1, 3],
            [2, 0, 5],
            [3, 2, 2],
        ];
        var result = HungarianSolver.Solve(cost);

        Assert.Equal(5, Total(cost, result)); // 1 + 2 + 2
        Assert.Equal(3, result.Distinct().Count());
    }

    [Fact]
    public void Rectangular_LeavesColumnsUnused()
    {
        double[][] cost =
        [
            [10, 1, 10, 10],
            [10, 10, 10, 1],
        ];
        var result = HungarianSolver.Solve(cost);

        Assert.Equal([1, 3], result);
    }

    [Fact]
    public void MoreRowsThanColumns_Throws()
    {
        Assert.Throws<ArgumentException>(() => HungarianSolver.Solve([[1], [2]]));
    }

    [Fact]
    public void ForbiddenPairs_AreAvoidedWhenPossible()
    {
        double[][] cost =
        [
            [double.PositiveInfinity, 5],
            [1, 1],
        ];
        var result = HungarianSolver.Solve(cost);

        Assert.Equal([1, 0], result);
    }

    [Fact]
    public void MatchesBruteForce_OnRandomMatrices()
    {
        var rng = new Random(123);
        for (var trial = 0; trial < 300; trial++)
        {
            var rows = rng.Next(1, 6);
            var cols = rows + rng.Next(0, 3);
            var cost = new double[rows][];
            for (var i = 0; i < rows; i++)
                cost[i] = Enumerable.Range(0, cols).Select(_ => (double)rng.Next(0, 20)).ToArray();

            var result = HungarianSolver.Solve(cost);

            Assert.Equal(rows, result.Distinct().Count());
            Assert.Equal(BruteForce(cost), Total(cost, result), 9);
        }
    }

    private static double Total(double[][] cost, int[] columnOfRow)
    {
        var sum = 0d;
        for (var i = 0; i < columnOfRow.Length; i++)
            sum += cost[i][columnOfRow[i]];
        return sum;
    }

    /// <summary>Tries every injective row→column mapping. Exponential, fine for ≤ 5 rows.</summary>
    private static double BruteForce(double[][] cost)
    {
        var best = double.PositiveInfinity;
        var used = new bool[cost[0].Length];
        Recurse(0, 0);
        return best;

        void Recurse(int row, double acc)
        {
            if (row == cost.Length)
            {
                best = Math.Min(best, acc);
                return;
            }
            for (var c = 0; c < used.Length; c++)
            {
                if (used[c]) continue;
                used[c] = true;
                Recurse(row + 1, acc + cost[row][c]);
                used[c] = false;
            }
        }
    }
}
