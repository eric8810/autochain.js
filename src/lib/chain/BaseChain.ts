import { logging } from '../log/Logging';
import { BaseModel } from 'pydantic';

import { BaseAgent } from './base_agent';
import { ChatMessageHistory, MessageType } from './message';
import { AgentAction, AgentFinish } from './structs';
import { constants } from '../chain/constants';
import { BaseMemory } from '../memory/base';
import { Tool } from '../tools/base';

export interface BaseChainProps {
  agent?: BaseAgent | null;
  memory?: BaseMemory | null;
  last_query: string;
  max_iterations?: number | null;
  max_execution_time?: number | null;
}

export abstract class BaseChain extends BaseModel {
  logger = logging.getLogger(BaseChain.name);
  agent?: BaseAgent | null;
  memory?: BaseMemory | null;
  last_query: string;
  max_iterations?: number | null;
  max_execution_time?: number | null;

  constructor(props: BaseChainProps) {
    super(props);
  }

  abstract prep_inputs(user_query: string): { [key: string]: string };

  abstract prep_output(
    inputs: { [key: string]: string },
    output: AgentFinish,
    return_only_outputs?: boolean
  ): { [key: string]: any };

  abstract _run(inputs: { [key: string]: any }): AgentFinish;

  abstract take_next_step(
    name_to_tool_map: { [key: string]: Tool },
    inputs: { [key: string]: string }
  ): AgentFinish | AgentAction;

  abstract should_answer(inputs: { [key: string]: any }): AgentFinish | null;

  _should_continue(iterations: number, time_elapsed: number): boolean {
    if (
      this.max_iterations !== undefined &&
      this.max_iterations !== null &&
      iterations >= this.max_iterations
    ) {
      return false;
    }
    if (
      this.max_execution_time !== undefined &&
      this.max_execution_time !== null &&
      time_elapsed >= this.max_execution_time
    ) {
      return false;
    }

    return true;
  }

  run(
    user_query: string,
    return_only_outputs?: boolean
  ): { [key: string]: any };

  run(
    user_query: string,
    return_only_outputs: boolean = false
  ): { [key: string]: any } {
    const inputs = this.prep_inputs(user_query);
    this.logger.info(`\n Input to agent: ${inputs}`);

    try {
      const output = this._run(inputs);

      return this.prep_output(inputs, output, return_only_outputs);
    } catch (e) {
      throw e;
    }
  }
}
