import setuptools

from quark import __version__

with open("README.md") as fh:
    long_description = fh.read()

required_requirements = [
    "prettytable>=1.0.0",
    "androguard==3.4.0a1",
    "tqdm",
    "colorama",
    "graphviz",
    "prompt-toolkit",
    "plotly",
    "rzpipe",
    "click",
    "r2pipe==1.8.0",
    "ciphey"
]

quarkAgentRequirements = [
    "langchain==0.3.1",
    "langchain-core==0.3.6",
    "langchain-openai==0.2.1",
    "langgraph==0.2.28",
    "flask==2.2.5",
]

setuptools.setup(
    name="quark-engine",  # Replace with your own username
    version=__version__,
    author="YuShiang Dang, ShengFeng Lu, KunYu Chen",
    author_email="pulorsok@gmail.com",
    description="An Obfuscation-Neglect Android Malware Scoring System",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/quark-engine/quark-engine",
    packages=setuptools.find_packages(exclude=("tests",)),
    include_package_data=True, 
    package_data={
        "quark.core.axmlreader": ["axml_definition"],
        "quark.webreport": [
            "analysis_report_layout.html",
            "genrule_report_layout.html",
        ],
        "quark.agent": ['static/*', 'templates/*'],
        "quark.script.frida": ["agent.js"],
    },
    entry_points={
        "console_scripts": [
            "quark=quark.cli:entry_point",
            "freshquark=quark.freshquark:entry_point",
            "quark-agent=quark.agent.quarkAgent:entryPoint",
            "quark-agent-web=quark.agent.quarkAgentWeb:entryPoint",
        ]
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: GNU General Public License v3 (GPLv3)",
        "Operating System :: OS Independent",
        "Topic :: Security",
    ],
    python_requires=">=3.8",
    install_requires=required_requirements,
    extras_require={
        "QuarkAgent": quarkAgentRequirements,
    },
)
