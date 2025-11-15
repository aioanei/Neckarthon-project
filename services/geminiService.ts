
import { GoogleGenAI, Type } from "@google/genai";
import { NodeType, LabNode } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Lab Automation Engineer. 
Your goal is to help users design automated laboratory setups.
You understand dependencies (Required) and optional add-ons (Compatible).
Structure your output strictly as requested.
`;

// Since the user has "everything", we use a broad list of common keywords to auto-tag inventory
const LAB_INVENTORY_KEYWORDS = [
  'Robot', 'Arm', 'Gripper', 'Pipette', 'Handler', 'Dispenser', 'Washer',
  'Centrifuge', 'Incubator', 'Cytomat', 'Peeler', 'Sealer', 'Reader',
  'Microscope', 'Imager', 'Camera', 'Conveyor', 'Track', 'Hotel', 'Storage',
  'PC', 'Server', 'Controller', 'Barcode', 'Scanner', 'Printer', 'Pump',
  'Reservoir', 'Shaker', 'Mixer', 'Heater', 'Cooler', 'Magnet', 'Cycler', 'PCR'
];

const checkInventory = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  return LAB_INVENTORY_KEYWORDS.some(keyword => lowerName.includes(keyword.toLowerCase()));
};

// --- RETRY LOGIC HELPER ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateWithRetry = async (model: string, params: any, retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent({ model, ...params });
    } catch (e: any) {
      // Check if error is related to rate limiting (429)
      const isRateLimit = e.status === 429 || e.code === 429 || (e.message && e.message.includes('429')) || (e.message && e.message.includes('quota'));
      
      if (isRateLimit) {
        if (i === retries - 1) throw e; // Max retries reached
        const delay = Math.pow(2, i) * 2000 + Math.random() * 1000; // Exponential backoff + jitter
        console.warn(`Rate limit hit. Retrying in ${Math.round(delay)}ms...`);
        await wait(delay);
        continue;
      }
      throw e; // Re-throw other errors immediately
    }
  }
};

export const analyzeInitialProblem = async (problemDescription: string): Promise<LabNode> => {
  const modelId = 'gemini-2.5-flash';
  
  const prompt = `
    The user wants to build an automation lab for this problem: "${problemDescription}".
    
    Create a root node for the main goal, and then suggest 4-7 immediate children nodes.
    
    Rules:
    1. Identify 'REQUIRED' nodes (absolute dependencies, physical arms, main inputs).
    2. Identify 'COMPATIBLE' nodes (optional modules, enhancements, or software).
    3. Ensure a mix of hardware (robots, benches) and logic (software, controllers).
    4. For every child node, provide realistic 'specs' (e.g., Vendor, Model) if applicable.
    5. Keep descriptions concise (max 20 words).
    6. Keep spec values short (max 5 words).
    
    Return a JSON object representing the root node with a 'children' array.
  `;

  try {
    const response = await generateWithRetry(modelId, {
        contents: prompt,
        config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: [NodeType.ROOT] },
            description: { type: Type.STRING },
            specs: { 
                type: Type.OBJECT,
                properties: {
                    throughput: { type: Type.STRING },
                    dimensions: { type: Type.STRING },
                }
            },
            children: {
                type: Type.ARRAY,
                items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: [NodeType.REQUIRED, NodeType.COMPATIBLE] },
                    description: { type: Type.STRING },
                    specs: { 
                        type: Type.OBJECT,
                        properties: {
                            vendor: { type: Type.STRING },
                            model: { type: Type.STRING },
                            capacity: { type: Type.STRING },
                        }
                    }
                },
                required: ['id', 'name', 'type', 'description', 'specs']
                }
            }
            },
            required: ['id', 'name', 'type', 'description', 'children']
        }
        }
    });

    if (response.text) {
        const result = JSON.parse(response.text) as LabNode;
        // Post-process to check inventory
        if (result.children) {
            result.children = result.children.map(child => ({
                ...child,
                inInventory: checkInventory(child.name)
            }));
        }
        return result;
    }
  } catch (e) {
    console.error("Error in analyzeInitialProblem:", e);
    throw new Error("Failed to generate initial plan. Please try again later.");
  }
  throw new Error("Failed to generate initial plan");
};

export const expandNodeChildren = async (parentNode: LabNode, existingNodeNames: string[]): Promise<LabNode[]> => {
  const modelId = 'gemini-2.5-flash';

  const prompt = `
    The user has selected the component: "${parentNode.name}" (Type: ${parentNode.type}) in a lab automation workflow.
    Description: ${parentNode.description}.
    
    Context: The lab ALREADY contains the following items: ${JSON.stringify(existingNodeNames)}.
    
    Task: Suggest 3-6 NEW sub-components, dependencies, or next steps.
    
    Rules:
    1. **CRITICAL**: DO NOT suggest items that are exactly matched in the existing items list.
    2. 'REQUIRED': What *must* be connected next? (e.g., 'Power Supply', 'Controller').
    3. 'COMPATIBLE': What *can* be connected?
    4. If the component is a leaf node, return an empty array.
    5. INCLUDE SPECS (Vendor, Model) for every suggestion.
    6. Keep descriptions concise (max 20 words).
    7. Keep spec values short.
    
    Return only an array of new child nodes.
  `;

  try {
    const response = await generateWithRetry(modelId, {
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        type: { type: Type.STRING, enum: [NodeType.REQUIRED, NodeType.COMPATIBLE] },
                        description: { type: Type.STRING },
                        specs: { 
                            type: Type.OBJECT,
                            properties: {
                                vendor: { type: Type.STRING },
                                model: { type: Type.STRING },
                                rating: { type: Type.STRING },
                            }
                        }
                    },
                    required: ['id', 'name', 'type', 'description', 'specs']
                }
            }
        }
    });

    if (response.text) {
        try {
            const nodes = JSON.parse(response.text) as LabNode[];
            return nodes.map(node => ({
                ...node,
                inInventory: checkInventory(node.name)
            }));
        } catch (e) {
            console.error("JSON Parse Error in expandNodeChildren:", e);
            return [];
        }
    }
  } catch (error) {
    console.error("Gemini API Error in expandNodeChildren:", error);
    return [];
  }
  
  return [];
};

export const generateLabURS = async (rootNode: LabNode): Promise<string> => {
  const modelId = 'gemini-2.5-flash';
  
  // Flatten tree to string for context, removing circular refs if any
  const treeContext = JSON.stringify(rootNode, (key, value) => {
    if (key === 'parent' || (key === 'children' && (!value || value.length === 0))) return undefined;
    return value;
  }, 2);

  const prompt = `
    You are a Senior Technical Writer for a Lab Automation Company.
    Generate a formal **User Requirements Specification (URS)** document for the following Lab Automation System based on the provided JSON tree design.
    
    TREE DATA:
    ${treeContext}
    
    **INSTRUCTIONS:**
    1. Generate the output as a **single raw HTML string** using **Tailwind CSS** classes for styling. 
    2. DO NOT wrap the output in markdown code blocks (like \`\`\`html). Just return the raw HTML string.
    3. The document must look like a professional A4 paper document (white background, black text).
    
    **DOCUMENT STRUCTURE & CONTENT:**
    
    **Header**
    *   Title: "User Requirements Specification"
    *   Project Name: ${rootNode.name}
    *   Date: ${new Date().toLocaleDateString()}
    *   Version: 1.0
    
    **Section 1: Project Scope**
    *   Write a professional executive summary describing the system based on the root node's description and specs.
    
    **Section 2: Instrumentation & Equipment**
    *   Create a full-width table.
    *   Columns: **ID** (use generated IDs or count), **Requirement Name**, **Vendor**, **Model**, **Criticality** (M/O - Mandatory for Required, Optional for Compatible).
    *   Iterate through the tree and list EVERY hardware component.
    
    **Section 3: Labware & Consumables**
    *   Create a table listing items that appear to be labware (e.g., "Plate", "Tip", "Tube", "Vial", "Reservoir").
    *   Columns: **Item**, **Description**, **Est. Quantity**.
    
    **Section 4: Software & Interfaces**
    *   List requirements for software, controllers, and user interfaces found in the tree.
    
    **Section 5: General Requirements**
    *   Add standard boilerplate industry requirements for:
        *   **Safety**: Emergency stops, door locks.
        *   **Power**: UPS requirements.
        *   **Data**: Audit trails.
        
    **STYLING RULES (Tailwind):**
    *   Use \`bg-white p-8 text-slate-900 max-w-[210mm] mx-auto shadow-lg my-8\`.
    *   Headings: \`text-2xl font-bold text-slate-800 mb-4 border-b pb-2\`.
    *   Tables: \`w-full border-collapse border border-slate-300 mb-8 text-sm\`.
    *   Th: \`bg-slate-100 border border-slate-300 p-2 text-left font-bold\`.
    *   Td: \`border border-slate-300 p-2\`.
    *   M/O Column: Center aligned.
  `;

  try {
    const response = await generateWithRetry(modelId, {
        contents: prompt,
    });
    return response.text || "<div class='p-4 text-red-500'>Failed to generate document content.</div>";
  } catch (e) {
    console.error("Error generating URS:", e);
    return "<div class='p-4 text-red-500'>Error generating documentation. Please try again.</div>";
  }
};
