import numpy as np

def compute_average(numbers):
    """ Custom function to compute the average of a list of numbers """
    if not numbers:
        return 0  # Handle empty list case
    total = sum(numbers)
    count = len(numbers)
    return total / count

def compute_average_numpy(numbers):
    """ NumPy function to compute the average of a list of numbers """
    return np.mean(numbers)

def get_numbers_from_user():
    """ Function to take user input """
    while True:
        try:
            user_input = input("Enter a list of whole numbers separated by spaces: ")
            numbers = list(map(int, user_input.split()))
            if not numbers:
                raise ValueError("List cannot be empty.")
            return numbers
        except ValueError as e:
            print(f"Invalid input: {e}. Please enter only whole numbers.")

numbers = get_numbers_from_user()
print(f"Average of list is: {compute_average(numbers)}")
print(f"Average numpy of list is: {compute_average_numpy(numbers)}")            

