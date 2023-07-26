import * as logging from "logging";import { Dict } from "typing";

import { MessageType } from "autochain.agent.message";import { AgentAction, AgentFinish } from "autochain.agent.structs";import { BaseChain } from "autochain.chain.base_chain";import { ToolRunningError } from "autochain.errors";import { Tool } from "autochain.tools.base";import { HandOffToAgent } from "autochain.tools.simple_handoff.tool";

const logger = logging.getLogger(name);

export class Chain extends BaseChain {return_intermediate_steps: boolean = false;handle_parsing_errors = true;graceful_exit_tool: Tool = new HandOffToAgent();

handle_repeated_action(agent_action: AgentAction): AgentFinish {console.log(Action taken before: ${agent_action.tool},  +input: ${agent_action.tool_input});

if (agent_action.model_response) {
  return {
    message: agent_action.response,
    log: `Action taken before: ${agent_action.tool}, ` +
      `input: ${agent_action.tool_input}`,
  };
} else {
  console.log("No response from agent. Gracefully exit due to repeated action");
  return {
    message: this.graceful_exit_tool.run(),
    log: `Gracefully exit due to repeated action`,
  };
}

}

take_next_step(name_to_tool_map: Dict<string, Tool>,inputs: Dict<string, string>): [AgentFinish, AgentAction] {try {// Call the LLM to see what to do.const output = this.agent.plan(inputs);

   if (output instanceof AgentAction) {
    output = this.agent.clarify_args_for_agent_action(output, inputs);
  }

  if (output instanceof AgentFinish) {
    return output;
  }

  if (output instanceof AgentAction) {
    let tool_output = "";

    if (output.tool in name_to_tool_map) {
      const tool = name_to_tool_map[output.tool];

      if (output.tool_input === this.memory.load_memory(tool.name)) {
        return this.handle_repeated_action(output);
      }

      this.memory.save_memory(tool.name, output.tool_input);

      try {
        tool_output = tool.run(output.tool_input);
      } catch (e) {
        const new_agent_action = this.agent.fix_action_input(
          tool,
          output,
          (e as Error).message
        );

        if (
          new_agent_action &&
          new_agent_action.tool_input !== output.tool_input
        ) {
          tool_output = tool.run(output.tool_input);
        }
      }

      console.log(
        `Took action '${tool.name}' with inputs '${output.tool_input}', ` +
          `and the tool_output is ${tool_output}`
      );
    } else {
      tool_output = `Tool ${output.tool} is not supported`;
    }

    output.tool_output = tool_output;
    return output;
  }

  throw new Error(`Unsupported action: ${typeof output}`);
} catch (e) {
  if (!this.handle_parsing_errors) {
    throw e;
  }

  const tool_output = `Invalid or incomplete response due to ${e}`;
  console.log(tool_output);

  const output = {
    message: this.graceful_exit_tool.run(),
    log: tool_output,
  };

  return output;
}

}}
