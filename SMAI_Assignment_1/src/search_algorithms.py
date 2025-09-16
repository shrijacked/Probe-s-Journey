from collections import deque
import heapq
from typing import Callable, List, Optional, Tuple

from .puzzle import AsteroidFieldPuzzle


def depth_first_search(initial_state: AsteroidFieldPuzzle):
    """Implement DFS to solve the asteroid field puzzle."""
    stack = [(initial_state, [])]  # (state, path)
    visited = set()
    nodes_explored = 0

    while stack:
        current_state, path = stack.pop()
        nodes_explored += 1

        if current_state.is_goal():
            return path, nodes_explored

        state_key = current_state.get_state_key()
        if state_key in visited:
            continue

        visited.add(state_key)

        # Generate valid moves
        for move, next_state in current_state.move_gen():
            next_state_key = next_state.get_state_key()
            if next_state_key not in visited:
                stack.append((next_state, path + [move]))

    return None, nodes_explored  # No solution found


def breadth_first_search(initial_state: AsteroidFieldPuzzle):
    """Implement BFS to solve the asteroid field puzzle."""
    queue = deque([(initial_state, [])])  # (state, path)
    visited = set()
    nodes_explored = 0

    while queue:
        current_state, path = queue.popleft()
        nodes_explored += 1

        if current_state.is_goal():
            return path, nodes_explored

        state_key = current_state.get_state_key()
        if state_key in visited:
            continue

        visited.add(state_key)

        # Generate valid moves
        for move, next_state in current_state.move_gen():
            next_state_key = next_state.get_state_key()
            if next_state_key not in visited:
                queue.append((next_state, path + [move]))

    return None, nodes_explored  # No solution found


def best_first_search(initial_state: AsteroidFieldPuzzle, heuristic_func: Callable[[AsteroidFieldPuzzle], int]):
    """Implement Best First Search using a priority queue with the provided heuristic."""
    # Priority queue: (heuristic_value, counter, state, path)
    heap = [(heuristic_func(initial_state), 0, initial_state, [])]
    visited = set()
    nodes_explored = 0
    counter = 1  # To break ties in priority queue

    while heap:
        _, _, current_state, path = heapq.heappop(heap)
        nodes_explored += 1

        if current_state.is_goal():
            return path, nodes_explored

        state_key = current_state.get_state_key()
        if state_key in visited:
            continue

        visited.add(state_key)

        # Generate valid moves
        for move, next_state in current_state.move_gen():
            next_state_key = next_state.get_state_key()
            if next_state_key not in visited:
                h_value = heuristic_func(next_state)
                heapq.heappush(heap, (h_value, counter, next_state, path + [move]))
                counter += 1

    return None, nodes_explored  # No solution found


