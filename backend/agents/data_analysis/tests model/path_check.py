import os
import sys
import inspect

current_dir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
print(f'Current directory: {current_dir}')

parent_dir = os.path.dirname(current_dir)
print(f'Parent directory: {parent_dir}')

sys.path.insert(0, parent_dir)
print(f'System path: {sys.path}')

# Try to import
try:
    import backend
    print("Successfully imported backend")
except ImportError as e:
    print(f"Failed to import backend: {e}")

# Try with absolute import
project_root = "/Volumes/KIOXIA/EAIO/EAIO_Multi-Agent_V2"
sys.path.insert(0, project_root)
print(f'System path with project root: {sys.path}')

try:
    import backend.agents.data_analysis.deep_learning_models
    print("Successfully imported deep_learning_models")
except ImportError as e:
    print(f"Failed to import deep_learning_models: {e}")