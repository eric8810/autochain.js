import { BaseChain } from 'autochain/chain/base_chain';
import { Tool } from 'autochain / tools / base';
import { LangChain, Chain as LangChainObj } from 'langchain / chains / base';
import { BaseMemory } from 'langchain / schema';
import { AgentFinish, AgentAction } from 'autochain / agent / structs';

class LangChainWrapperChain extends BaseChain {
  langchain: LangChain = null;
  memory: BaseMemory | null = null;

  constructor(langchain: LangChain, ...args: any[]) {
    super(...args);
    this.langchain = langchain;
    this.memory = this.langchain.memory;
  }

  run(user_query: string, kwargs: any): { [key: string]: any } {
    let response_msg: string = this.langchain.run(user_query);
    let agent_finish = new AgentFinish(response_msg, '');
    return agent_finish.format_output();
  }

  take_next_step(
    name_to_tool_map: { [key: string]: Tool },
    inputs: { [key: string]: string }
  ): [AgentFinish, AgentAction] {
    // implement the logic here
    return;
  }
}
