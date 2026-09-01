import { GoogleGenAI } from '@google/genai';

export async function generateFilterFunction(
  apiKey: string,
  schema: string[],
  query: string
): Promise<(row: Record<string, string>) => boolean> {
  // Use 'gemini-2.5-flash' for fast text reasoning
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are a Javascript expert. I have an array of objects representing rows in a database table.
The objects have the following string keys (schema):
${JSON.stringify(schema)}

The user wants to filter this data with the following query:
"${query}"

Write a Javascript arrow function that takes a single parameter \`row\` (which is one object from the array) and returns \`true\` if the row matches the user's query, and \`false\` otherwise.

IMPORTANT RULES:
1. ONLY return the Javascript code for the arrow function. Do not include markdown formatting (like \`\`\`javascript), do not include comments, do not include any other text.
2. The values in the \`row\` object are ALL STRINGS. If you need to perform numerical comparisons, make sure to convert them to numbers using \`Number()\`.
3. If you need to perform case-insensitive string comparisons, convert both sides to lowercase.

Example output format:
(row) => Number(row.Age) > 30 && row.Department.toLowerCase() === 'sales'
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let code = response.text || '';
    
    // Clean up markdown just in case the model ignores the instruction
    code = code.replace(/```javascript/gi, '').replace(/```js/gi, '').replace(/```/g, '').trim();

    // Use the Function constructor to evaluate the code safely into a function
    const filterFn = new Function(`return ${code}`)();
    return filterFn;
  } catch (error) {
    console.error('Error generating filter function:', error);
    throw new Error('Failed to generate filter function. Please check your query and API key.');
  }
}
