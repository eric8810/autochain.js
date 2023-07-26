import { BaseMessage, UserMessage } from “autochain/agent/message”;

class JSONPromptTemplate {template: string;input_variables: string[];

constructor(template: string, input_variables: string[]) {
    this.template = template;
    this.input_variables = input_variables;
}

format_prompt(...kwargs: { [key: string]: any }): BaseMessage[] {
    const variables: { [key: string]: string } = {};
    this.input_variables.forEach((v) => {
        variables[v] = "";
    });
    Object.assign(variables, kwargs);
    const prompt = this.template.replace(/\${(\w+)}/g, (match, p1) => variables[p1]);
    return [new UserMessage(prompt)];
}

}

export default JSONPromptTemplate;
