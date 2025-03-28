import cProfile
import pstats
import timeit
import subprocess
import Avg
10
def main():
    """ Main function to execute profiling and performance analysis """
    numbers = list(range(1, 1000000))  # Large dataset for testing

    # Run both functions and print results
    print(f"Average (Custom Function): {Avg.compute_average(numbers)}")
    print(f"Average (NumPy Function): {Avg.compute_average_numpy(numbers)}")

    # Measure execution time using timeit
    py_time = timeit.timeit(lambda: Avg.compute_average(numbers), number=10)
    np_time = timeit.timeit(lambda: Avg.compute_average_numpy(numbers), number=10)

    print(f"\nExecution Time Analysis:")
    print(f"Python Custom Function: {py_time:.5f} sec")
    print(f"NumPy Mean Function: {np_time:.5f} sec")

if __name__ == "__main__":
    # Enable profiling
    profiler = cProfile.Profile()
    profiler.enable()

    main()  # Run main function while profiling

    profiler.disable()

    # Save profiling data
    profiler.dump_stats("profile_output.prof")

    # Print profiling results sorted by cumulative time
    stats = pstats.Stats(profiler)
    stats.strip_dirs().sort_stats("cumulative").print_stats(10)

    # Generate call graph using gprof2dot (requires Graphviz)
    subprocess.run("gprof2dot -f pstats profile_output.prof | dot -Tpng -o call_graph.png", shell=True)

    print("\nProfiling completed! Call graph saved as 'call_graph.png'.")
