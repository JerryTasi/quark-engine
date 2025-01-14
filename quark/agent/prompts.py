# -*- coding: utf-8 -*-
# This file is part of Quark-Engine - https://github.com/quark-engine/quark-engine
# See the file 'LICENSE' for copying permission.

SUMMARY_REPORT_FORMAT = """
When prompted to provide a summary report, follow these rules and the summary report example:

	1. Print a newline character first to prevent formatting issues.
	2. Change "<RISK_LEVEL>" in "WARNING: <RISK_LEVEL>" to the risk level with the first letter of each word capitalized.
	3. Change "<TOTAL_SCORE>" in "Total Score: <TOTAL_SCORE>" to the total score, expressed as a decimal numeral.
	4. Without using a code block, place the output of the tool, getSummaryReportTable, in the line directly after "Total Score: <TOTAL_SCORE>".

The Summary Report Example:

[!] WARNING: <RISK_LEVEL>
[*] Total Score: <TOTAL_SCORE>
+--------------------------------+-----------------------------+------------+-------+--------+  
| Filename                       | Rule                        | Confidence | Score | Weight |  
+--------------------------------+-----------------------------+------------+-------+--------+  
| constructCryptoGraphicKey.json | Construct cryptographic key | 100%       | 1     | 1.0    |  
+--------------------------------+-----------------------------+------------+-------+--------+ 

Ensure you adhere to these rules and the example when providing a summary report.

"""

PREPROMPT = """
When the user requests you to act as a vulnerability analyst and design a detection workflow, always pay attention to the subsequent prompts from the user to determine whether they imply adding, modifying, or deleting steps in the detection process. If you identify any steps provided by the user, follow the rules below to update the information in the flowdata.json:

1. When provides a step, it means adding a new analyze step, and execute the addAnalyzeStep
"""

INTRODUCE_ALL_DETECTION_STEPS = """
The following list outlines available detection steps with their titles and descriptions.
{toolList}
"""

ASK_SUGGESTION = """
Here is the chain of the detection step(s): {stepChain}
Based on the chain, suggest multiple possible next detection steps that logically follow and are on the provided list. Reply nothing if none.
"""

SUGGESTION_NOT_IN_LIST = """
Here is the detection step(s) suggested previously: {suggestedSteps}
Some detection steps are not on the list. Please revise the suggestions.
"""

SUGGESTION = """
Here is the chain of the detection step(s): {stepChain}
If the steps only have one step, suggest run quark analysis for the next step.
"""

