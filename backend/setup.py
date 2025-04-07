from setuptools import setup, find_packages

setup(
    name="energy-ai-optimizer",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "fastapi",
        "uvicorn",
        "pandas",
        "numpy",
        "pyautogen",
        "openai",
    ],
) 