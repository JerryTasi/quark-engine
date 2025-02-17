# -*- coding: utf-8 -*-
# This file is part of Quark-Engine - https://github.com/quark-engine/quark-engine
# See the file 'LICENSE' for copying permission.

import json
import uuid

from quark.script import Rule, _getQuark, QuarkResult
from quark.core.struct.ruleobject import RuleObject
from quark.utils.weight import Weight
from quark.core.quark import Quark
from quark.utils import colors

# Import the optional dependency, langchain
try:
    from langchain.agents import tool
except ModuleNotFoundError as e:
    # Create a fake tool in case langchain is not installed.
    def tool(func):
        return func

rule_checker = None
quark = None
parameters = None
behaviorOccurList = None
ruleInstance = None
quarkResultInstance = None


@tool
def initRuleObject(rule_path: str):
    """
    Initialize a rule from the rule path.
    """
    global rule_checker

    rule_checker = RuleObject(rule_path)

    return "Rule initialized successfully"


@tool
def initQuarkObject(apk_path: str):
    """
    Init Quark using the apk path.
    """
    global quark

    quark_lib = "androguard"
    quark = Quark(apk_path, core_library=quark_lib)

    return "Quark initialized successfully"


@tool
def runQuarkAnalysisForSummaryReport():
    """
    Run Quark analysis with a rule.
    """
    quark.run(rule_checker)
    quark.show_summary_report(rule_checker)
    return "Successfully run Quark analysis"


@tool
def getSummaryReportTable():
    """
    Get the summary report table from the Quark analysis result.
    """
    summaryReport = quark.quark_analysis.summary_report_table.get_string()

    return summaryReport


@tool
def getAnalysisResultRisk():
    """
    Get the risk from the Quark analysis result.
    """
    weight = Weight(
        quark.quark_analysis.score_sum, quark.quark_analysis.weight_sum
    )

    return weight.calculate()


@tool
def getAnalysisResultScore():
    """
    Get the score from the Quark analysis result.
    """
    return quark.quark_analysis.score_sum


@tool
def colorizeInYellow(text: str) -> str:
    """Colorize text in yellow.

    :param text: a text
    :return: the text in yellow
    """

    return colors.yellow(text)


@tool
def colorizeInCyan(text: str) -> str:
    """Colorize text in cyan.

    :param text: a text
    :return: the text in cyan
    """

    return colors.cyan(text)


@tool
def colorizeInGreen(text: str) -> str:
    """Colorize text in green.

    :param text: a text
    :return: the text in green
    """

    return colors.green(text)


@tool
def colorizeInRed(text: str) -> str:
    """Colorize text in red.

    :param text: a text
    :return: the text in red
    """

    return colors.red(text)


@tool
def loadRule(rulePath: str):
    """
    Given a rule path,
    this instance loads a rule from the rule path.

    Used Quark Script API: Rule(rule.json)
    - description: Making detection rule a rule instance
    - params: Path of a single Quark rule
    - return: Quark rule instance
    - example:

        .. code:: python

            from quark.script import Rule

            ruleInstance = Rule("rule.json")

    """

    global ruleInstance
    ruleInstance = Rule(rulePath)

    return "Rule defined successfully"


@tool
def runQuarkAnalysis(samplePath: str):
    """
    Given detection rule and target sample,
    this instance runs the Quark Analysis.

    Used Quark Script API: runQuarkAnalysis(SAMPLE_PATH, ruleInstance)
    - description: Given detection rule and target sample,
                   this instance runs the basic Quark analysis
    - params:
        1. SAMPLE_PATH: Target file
        2. ruleInstance: Quark rule object
    - return: quarkResult instance
    - example:

        .. code:: python

            from quark.script import runQuarkAnalysis

            quarkResult = runQuarkAnalysis("sample.apk", ruleInstance)

    """

    global quarkResultInstance

    quark = _getQuark(samplePath)
    quarkResultInstance = QuarkResult(quark, ruleInstance)

    return "Quark analysis completed successfully"


@tool
def getBehaviorOccurList():
    """
    Extracts the behavior occurrence list from quark analysis result.

    Used Quark Script API: quarkResultInstance.behaviorOccurList
    - description: List that stores instances of detected behavior
                   in different part of the target file
    - params: none
    - return: detected behavior instance
    - example:

        .. code:: python

            from quark.script import runQuarkAnalysis

            quarkResult = runQuarkAnalysis("sample.apk", ruleInstance)
            for behavior in quarkResult.behaviorOccurList:
                print(behavior)

    """

    global behaviorOccurList

    behaviorOccurList = quarkResultInstance.behaviorOccurList
    return "Behavior occurrence list extracted successfully"


@tool
def getParameterValues():
    """
    Given the behavior occurrence list,
    this instance extracts the parameter values.

    Used Quark Script API: behaviorInstance.getParamValues(none)

    - description: Get parameter values that API1 sends to API2 in the behavior
    - params: none
    - return: python list containing parameter values.
    - example:

        .. code:: python

            from quark.script import runQuarkAnalysis

            quarkResult = runQuarkAnalysis("sample.apk", ruleInstance)
            for behavior in quarkResult.behaviorOccurList:
                paramValues = behavior.getParamValues()
                print(paramValues)
    """

    global parameters

    for behavior in behaviorOccurList:
        parameters = behavior.getParamValues()

    return parameters


@tool
def isHardCoded():
    """
    Given the parameter values,
    this instance checks if the parameter values are hard-coded
    and return the hard-coded parameter.

    Used Quark Script API: quarkResultInstance.isHardcoded(argument)
    - description: Check if the argument is hardcoded into the APK.
    - params:
        1. argument: string value that is passed in when a method is invoked
    - return: True/False
    - example:

        .. code:: python

            from quark.script import runQuarkAnalysis

            quarkResult = runQuarkAnalysis("sample.apk", ruleInstance)
            isHardcoded = quarkResult.isHardcoded("hardcodedValue")
            print(isHardcoded)
    """

    hardcodedParameters = []
    for parameter in parameters:
        if quarkResultInstance.isHardcoded(parameter):
            hardcodedParameters.append(parameter)

    return hardcodedParameters


@tool
def writeCodeInFile(code: str, pyFile: str):
    """
    Given the code and file name, this instance writes the code in the file.
    """

    with open(pyFile, "w") as file:
        file.write(code)

    return pyFile

@tool
def addAnalyzeStep(label):
    """
    Add a new step in analyze process.
    """
    print("addddddd")
    try:
        # Load the existing JSON file
        with open("flowdata/flowdata.json", 'r', encoding='utf-8') as file:
            data = json.load(file)

    except FileNotFoundError:
        # If the file doesn't exist, create the initial structure
        data = {
            "nodes": {
                "node1": {
                    "label": "執行 loadRule"
                }
            },
            "links": [
                {"source": "node1", "target": "node2"}
            ]
        }

    # Generate a random unique node id
    new_node_id = str(uuid.uuid4())

    # Add the new node with the provided label
    data["nodes"][new_node_id] = {
        "label": label
    }

    # Save the updated JSON back to the file
    with open("flowdata/flowdata.json", 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)
    

agentTools = [
    initRuleObject,
    initQuarkObject,
    runQuarkAnalysis,
    getSummaryReportTable,
    getAnalysisResultRisk,
    getAnalysisResultScore,
    colorizeInYellow,
    colorizeInCyan,
    colorizeInGreen,
    colorizeInRed,
    loadRule,
    runQuarkAnalysis,
    getBehaviorOccurList,
    getParameterValues,
    isHardCoded,
    writeCodeInFile,
    addAnalyzeStep,
]