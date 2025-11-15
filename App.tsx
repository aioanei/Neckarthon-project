
import React, { useState, useCallback, useRef, useEffect } from 'react';
import LabTree from './components/LabTree';
import { analyzeInitialProblem, expandNodeChildren, generateLabURS } from './services/geminiService';
import { LabNode, NodeType } from './types';
import { Beaker, Cpu, ArrowRight, RotateCw, AlertCircle, CheckCircle2, Zap, Settings2, Package, LayoutTemplate, Dna, FlaskConical, Microscope, FileText, X } from 'lucide-react';

// --- MASSIVE PREDEFINED DEMO TREES ---

const HTS_TREE: LabNode = {
  id: 'hts-root',
  name: 'Ultra-HTS Pharma Screening System',
  type: NodeType.ROOT,
  description: 'A massive industrial screening platform designed for 1536-well plate assays, capable of processing 1 million compounds per week.',
  inInventory: true,
  specs: { throughput: '1200 plates/day', footprint: '5m x 3m' },
  children: [
    {
      id: 'hts-logistics',
      name: 'Central Logistics Hub',
      type: NodeType.REQUIRED,
      description: 'Core transport infrastructure.',
      inInventory: true,
      specs: { vendor: 'HighRes', model: 'MicroDock' },
      children: [
        {
          id: 'hts-robot',
          name: '6-Axis Industrial Robot',
          type: NodeType.REQUIRED,
          description: 'Long-reach arm on linear rail.',
          inInventory: true,
          specs: { vendor: 'Fanuc', model: 'M-10iD/12' },
          children: [
             {
                id: 'hts-gripper',
                name: 'Servo Gripper',
                type: NodeType.REQUIRED,
                description: 'Smart gripper with force feedback.',
                inInventory: true,
                specs: { vendor: 'Schunk', model: 'EGL 90' },
                children: [
                    {
                        id: 'hts-fingers',
                        name: 'Custom Fingers',
                        type: NodeType.REQUIRED,
                        description: 'Landscape/Portrait optimized.',
                        inInventory: true,
                        specs: { material: 'Carbon Fiber' }
                    }
                ]
             },
             {
                id: 'hts-rail',
                name: '7m Linear Track',
                type: NodeType.REQUIRED,
                description: 'Extends robot reach across all modules.',
                inInventory: true,
                specs: { vendor: 'Gudel', model: 'TMF-1' }
             }
          ]
        },
        {
            id: 'hts-hotel',
            name: 'Ambient Plate Hotel x4',
            type: NodeType.REQUIRED,
            description: 'High capacity buffer storage.',
            inInventory: true,
            specs: { capacity: '800 plates' }
        }
      ]
    },
    {
      id: 'hts-liquids',
      name: 'Compound Management',
      type: NodeType.REQUIRED,
      description: 'Precise liquid handling zone.',
      inInventory: true,
      children: [
        {
            id: 'hts-echo',
            name: 'Acoustic Dispenser',
            type: NodeType.REQUIRED,
            description: 'Nanoliter transfer without tips.',
            inInventory: true,
            specs: { vendor: 'Labcyte', model: 'Echo 655T' },
            children: [
                {
                    id: 'hts-chiller',
                    name: 'Recirculating Chiller',
                    type: NodeType.REQUIRED,
                    description: 'Maintains transducer temperature.',
                    inInventory: true,
                    specs: { vendor: 'Thermo', model: 'Accel 250' }
                },
                {
                    id: 'hts-air',
                    name: 'Compressed Air Supply',
                    type: NodeType.REQUIRED,
                    description: 'Clean dry air for coupling.',
                    inInventory: true,
                    specs: { pressure: '6 bar' }
                },
                {
                    id: 'hts-surge',
                    name: 'Surge Tank',
                    type: NodeType.COMPATIBLE,
                    description: 'Buffer for coupling fluid.',
                    inInventory: true
                }
            ]
        },
        {
            id: 'hts-centrifuge',
            name: 'Automated Centrifuge',
            type: NodeType.REQUIRED,
            description: 'For removing bubbles in source plates.',
            inInventory: true,
            specs: { vendor: 'Agilent', model: 'VSpin' },
            children: [
                {
                    id: 'hts-balance',
                    name: 'Active Counterbalance',
                    type: NodeType.REQUIRED,
                    description: 'Auto-balancing bucket.',
                    inInventory: true
                }
            ]
        },
        {
            id: 'hts-peeler',
            name: 'Plate Peeler',
            type: NodeType.REQUIRED,
            description: 'Removes seals from source plates.',
            inInventory: true,
            specs: { vendor: 'Brooks', model: 'XPeel' },
            children: [
                {
                    id: 'hts-waste-tape',
                    name: 'Waste Tape Spool',
                    type: NodeType.REQUIRED,
                    description: 'Collects removed seals.',
                    inInventory: true
                }
            ]
        }
      ]
    },
    {
      id: 'hts-incubator-cluster',
      name: 'Incubation Cluster',
      type: NodeType.REQUIRED,
      description: 'Environmental control for cell assays.',
      inInventory: true,
      children: [
        {
            id: 'hts-cyto1',
            name: 'Cytomat 24 C450',
            type: NodeType.REQUIRED,
            description: 'Main assay incubator 37°C.',
            inInventory: true,
            specs: { vendor: 'Thermo', capacity: '450 plates' },
            children: [
                {
                    id: 'hts-co2',
                    name: 'CO2 Gas Supply',
                    type: NodeType.REQUIRED,
                    description: '5% CO2 Manifold.',
                    inInventory: true
                },
                {
                    id: 'hts-water',
                    name: 'Humidity Reservoir',
                    type: NodeType.REQUIRED,
                    description: 'Maintains 95% rH.',
                    inInventory: true
                }
            ]
        },
        {
            id: 'hts-cyto2',
            name: 'Cytomat 10 (4°C)',
            type: NodeType.COMPATIBLE,
            description: 'Cooled storage for reagents.',
            inInventory: true
        }
      ]
    },
    {
      id: 'hts-detection',
      name: 'Detection & Imaging',
      type: NodeType.REQUIRED,
      description: 'Data readout.',
      inInventory: true,
      children: [
        {
            id: 'hts-reader',
            name: 'Multimode Reader',
            type: NodeType.REQUIRED,
            description: 'Fluorescence, Luminescence, Absorbance.',
            inInventory: true,
            specs: { vendor: 'BMG Labtech', model: 'PHERAstar FSX' }
        },
        {
            id: 'hts-imager',
            name: 'High Content Imager',
            type: NodeType.COMPATIBLE,
            description: 'Confocal automated microscopy.',
            inInventory: true,
            specs: { vendor: 'PerkinElmer', model: 'Opera Phenix' },
            children: [
                {
                    id: 'hts-laser',
                    name: 'Laser Light Engine',
                    type: NodeType.REQUIRED,
                    description: '4-line laser unit.',
                    inInventory: true
                },
                {
                    id: 'hts-raid',
                    name: 'RAID Storage Server',
                    type: NodeType.REQUIRED,
                    description: 'Local cache for TBs of image data.',
                    inInventory: true,
                    specs: { capacity: '50TB' }
                }
            ]
        }
      ]
    },
    {
        id: 'hts-brain',
        name: 'Control System',
        type: NodeType.REQUIRED,
        description: 'The brain of the operation.',
        inInventory: true,
        children: [
            {
                id: 'hts-scheduler',
                name: 'Master Scheduler PC',
                type: NodeType.REQUIRED,
                description: 'Runs Green Button Go or Cellario.',
                inInventory: true,
                specs: { vendor: 'Dell', model: 'Precision Rack' }
            },
            {
                id: 'hts-ups',
                name: '3-Phase UPS',
                type: NodeType.REQUIRED,
                description: 'Uninterruptible Power Supply.',
                inInventory: true,
                specs: { capacity: '10kVA' }
            }
        ]
    }
  ]
};

const NGS_TREE: LabNode = {
  id: 'ngs-root',
  name: 'NGS Library Prep Factory',
  type: NodeType.ROOT,
  description: 'End-to-end genomic sequencing preparation pipeline, from extraction to library normalization.',
  inInventory: true,
  specs: { throughput: '384 samples/run', purity: 'High' },
  children: [
    {
        id: 'ngs-liquid',
        name: 'Hamilton STARlet',
        type: NodeType.REQUIRED,
        description: 'Primary liquid handling platform.',
        inInventory: true,
        children: [
            {
                id: 'ngs-channels',
                name: '8-Channel Pipetting Head',
                type: NodeType.REQUIRED,
                description: 'Independent channels for cherry picking.',
                inInventory: true
            },
            {
                id: 'ngs-96head',
                name: '96-Channel Head',
                type: NodeType.REQUIRED,
                description: 'For plate stamping.',
                inInventory: true
            },
            {
                id: 'ngs-odtc',
                name: 'On-Deck Thermal Cycler',
                type: NodeType.REQUIRED,
                description: 'For PCR amplification.',
                inInventory: true,
                specs: { vendor: 'Inheco', model: 'ODTC' },
                children: [
                    {
                        id: 'ngs-control',
                        name: 'Controller Box',
                        type: NodeType.REQUIRED,
                        description: 'External temperature controller.',
                        inInventory: true
                    }
                ]
            },
            {
                id: 'ngs-shaker',
                name: 'Heater/Shaker Module',
                type: NodeType.REQUIRED,
                description: 'For enzymatic reactions.',
                inInventory: true,
                specs: { vendor: 'Bioshake', model: '3000-T' }
            },
            {
                id: 'ngs-magnet',
                name: 'Magnetic Bead Separator',
                type: NodeType.REQUIRED,
                description: 'For SPRI bead cleanups.',
                inInventory: true,
                specs: { vendor: 'Alpaqua', model: 'Magnum FLX' }
            }
        ]
    },
    {
        id: 'ngs-qc',
        name: 'QC Station',
        type: NodeType.REQUIRED,
        description: 'Quality control of libraries.',
        inInventory: true,
        children: [
            {
                id: 'ngs-bioanalyzer',
                name: 'Fragment Analyzer',
                type: NodeType.REQUIRED,
                description: 'Automated electrophoresis.',
                inInventory: true,
                specs: { vendor: 'Agilent', model: 'TapeStation 4200' },
                children: [
                    {
                        id: 'ngs-tips',
                        name: 'Loading Tips',
                        type: NodeType.REQUIRED,
                        description: 'Conductive tips.',
                        inInventory: true
                    },
                    {
                        id: 'ngs-ladder',
                        name: 'Ladder Reagents',
                        type: NodeType.REQUIRED,
                        description: 'Molecular weight markers.',
                        inInventory: true
                    }
                ]
            },
            {
                id: 'ngs-qubit',
                name: 'Fluorometer',
                type: NodeType.COMPATIBLE,
                description: 'Rapid quantification.',
                inInventory: true
            }
        ]
    },
    {
        id: 'ngs-waste',
        name: 'Waste Management',
        type: NodeType.REQUIRED,
        description: 'Handling biohazardous waste.',
        inInventory: true,
        children: [
            {
                id: 'ngs-chute',
                name: 'Tip Chute',
                type: NodeType.REQUIRED,
                description: 'Gravity feed to bin.',
                inInventory: true
            },
            {
                id: 'ngs-liquid-waste',
                name: 'Liquid Waste Pump',
                type: NodeType.REQUIRED,
                description: 'Vacuum aspiration.',
                inInventory: true
            }
        ]
    }
  ]
};

const SYNBIO_TREE: LabNode = {
  id: 'syn-root',
  name: 'Synthetic Biology Foundry',
  type: NodeType.ROOT,
  description: 'Automated organism engineering, strain selection, and fermentation.',
  inInventory: true,
  specs: { capacity: '48 Parallel Bioreactors' },
  children: [
    {
        id: 'syn-colony',
        name: 'Colony Picker',
        type: NodeType.REQUIRED,
        description: 'Automated selection of bacterial colonies.',
        inInventory: true,
        specs: { vendor: 'Molecular Devices', model: 'QPix 400' },
        children: [
            {
                id: 'syn-pins',
                name: 'Picking Pins (96)',
                type: NodeType.REQUIRED,
                description: 'Sterilizable picking head.',
                inInventory: true
            },
            {
                id: 'syn-bath',
                name: 'Ethanol Wash Bath',
                type: NodeType.REQUIRED,
                description: 'Sterilization station.',
                inInventory: true
            },
            {
                id: 'syn-light',
                name: 'Light Table',
                type: NodeType.REQUIRED,
                description: 'For colony visualization.',
                inInventory: true
            }
        ]
    },
    {
        id: 'syn-reactor',
        name: 'Micro-Bioreactor System',
        type: NodeType.REQUIRED,
        description: 'High throughput fermentation.',
        inInventory: true,
        specs: { vendor: 'Sartorius', model: 'Ambr 250' },
        children: [
            {
                id: 'syn-vessels',
                name: 'Single-Use Vessels',
                type: NodeType.REQUIRED,
                description: '250mL bioreactor vessels.',
                inInventory: true
            },
            {
                id: 'syn-liquid-tower',
                name: 'Liquid Handling Tower',
                type: NodeType.REQUIRED,
                description: 'Automated feeding and sampling.',
                inInventory: true
            },
            {
                id: 'syn-sensors',
                name: 'Sensor Array',
                type: NodeType.REQUIRED,
                description: 'Monitoring pH, DO, Temp.',
                inInventory: true,
                children: [
                    {
                        id: 'syn-buffer',
                        name: 'pH Calibration Buffer',
                        type: NodeType.REQUIRED,
                        description: 'Daily calibration fluid.',
                        inInventory: true
                    }
                ]
            }
        ]
    },
    {
        id: 'syn-analysis',
        name: 'Metabolite Analyzer',
        type: NodeType.COMPATIBLE,
        description: 'Glucose/Lactate monitoring.',
        inInventory: true,
        specs: { vendor: 'Roche', model: 'Cedex Bio' }
    },
    {
        id: 'syn-cryo',
        name: 'Cryogenic Storage',
        type: NodeType.COMPATIBLE,
        description: 'Long term strain bank.',
        inInventory: true,
        specs: { vendor: 'LiCONiC', model: 'STC Ultrafreezer' },
        children: [
             {
                id: 'syn-ln2',
                name: 'Liquid Nitrogen Supply',
                type: NodeType.REQUIRED,
                description: 'Backup cooling.',
                inInventory: true
             }
        ]
    }
  ]
};

const DEMO_SCENARIOS = [
  { id: 'hts', title: 'Ultra-HTS Pharma', icon: <FlaskConical className="w-4 h-4 text-blue-400" />, tree: HTS_TREE },
  { id: 'ngs', title: 'NGS Genomics', icon: <Dna className="w-4 h-4 text-purple-400" />, tree: NGS_TREE },
  { id: 'syn', title: 'SynBio Foundry', icon: <Microscope className="w-4 h-4 text-green-400" />, tree: SYNBIO_TREE },
];

// Helper function defined outside component to avoid recursion type inference issues
const collectNodeNamesFromTree = (node: LabNode): string[] => {
  let names = [node.name];
  if (node.children) {
    for (const child of node.children) {
      names = [...names, ...collectNodeNamesFromTree(child)];
    }
  }
  return names;
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [rootNode, setRootNode] = useState<LabNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoExpanding, setAutoExpanding] = useState(false);

  // URS Generation States
  const [isGeneratingURS, setIsGeneratingURS] = useState(false);
  const [ursHtml, setUrsHtml] = useState<string | null>(null);

  // Ref to hold the latest tree state for async recursion access
  const rootNodeRef = useRef<LabNode | null>(null);

  useEffect(() => {
    rootNodeRef.current = rootNode;
  }, [rootNode]);

  // Find a node by ID deep in the tree
  const findNode = useCallback((node: LabNode, id: string): LabNode | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Update a node in the tree (immutably)
  const updateNodeInTree = useCallback((currentRoot: LabNode, updatedNode: LabNode): LabNode => {
    if (currentRoot.id === updatedNode.id) {
      return updatedNode;
    }
    if (currentRoot.children) {
      return {
        ...currentRoot,
        children: currentRoot.children.map(child => updateNodeInTree(child, updatedNode))
      };
    }
    return currentRoot;
  }, []);

  const expandNodeRecursively = async (nodeId: string, knownNames: Set<string>, depth: number = 0) => {
    // Increased depth limit to allow for longer chains of requirements
    if (depth > 15) return;

    // 1. Get Latest State from Ref
    let currentRoot = rootNodeRef.current;
    if (!currentRoot) return;

    let targetNode = findNode(currentRoot, nodeId);
    
    // Stop if node missing, already generating, or already populated
    if (!targetNode || targetNode.isGenerating || (targetNode.children && targetNode.children.length > 0)) {
      return;
    }

    // 2. Mark as loading - Update Ref IMMEDIATELY so parallel calls see the lock
    const markingTree = updateNodeInTree(currentRoot, { ...targetNode, isGenerating: true });
    rootNodeRef.current = markingTree;
    setRootNode(markingTree); // Schedule UI update

    try {
      // 3. Fetch suggestions
      const existingNames = Array.from(knownNames);
      const newChildren = await expandNodeChildren(targetNode, existingNames);

      // 4. Re-fetch State from Ref (It might have changed while we were awaiting!)
      currentRoot = rootNodeRef.current;
      if (!currentRoot) return;
      
      targetNode = findNode(currentRoot, nodeId);
      if (!targetNode) return;

      // 5. Process Children
      const processedChildren = newChildren.map(child => ({
        ...child,
        id: crypto.randomUUID(),
      }));

      // 6. Update Tree State & Ref
      processedChildren.forEach(c => knownNames.add(c.name));
      
      const expandedNode: LabNode = {
        ...targetNode,
        isGenerating: false,
        children: processedChildren,
        isExpanded: true
      };
      
      const finalTree = updateNodeInTree(currentRoot, expandedNode);
      rootNodeRef.current = finalTree; // Critical: Update ref immediately for next recursion step
      setRootNode(finalTree); // Schedule UI update

      // 7. Recursive Step: Auto-expand REQUIRED nodes
      const requiredChildren = processedChildren.filter(c => c.type === NodeType.REQUIRED);
      
      if (requiredChildren.length > 0) {
         // CRITICAL FIX: Execute sequentially instead of Promise.all to prevent 429 Rate Limits
         for (const reqChild of requiredChildren) {
             await expandNodeRecursively(reqChild.id, knownNames, depth + 1);
             // Small delay to be nice to the API
             await new Promise(resolve => setTimeout(resolve, 300));
         }
      }

    } catch (e) {
      console.error("Expansion failed for", nodeId, e);
      // Reset loading state on error
      currentRoot = rootNodeRef.current;
      if (currentRoot) {
          targetNode = findNode(currentRoot, nodeId);
          if (targetNode) {
             const resetTree = updateNodeInTree(currentRoot, { ...targetNode, isGenerating: false });
             rootNodeRef.current = resetTree;
             setRootNode(resetTree);
          }
      }
    }
  };

  const handleInitialSearch = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeInitialProblem(prompt);
      const processedResult = { ...result, id: crypto.randomUUID() };
      if (processedResult.children) {
        processedResult.children = processedResult.children.map(c => ({ ...c, id: crypto.randomUUID() }));
      }
      
      // Initialize tree
      setRootNode(processedResult);
      rootNodeRef.current = processedResult; // Set ref immediately
      setSelectedNodeId(processedResult.id);

      // Start auto-expansion immediately
      const initialRequired = processedResult.children?.filter(c => c.type === NodeType.REQUIRED) || [];
      
      if (initialRequired.length > 0) {
          setAutoExpanding(true);
          const allNames = collectNodeNamesFromTree(processedResult);
          const nameSet = new Set(allNames);

          // Sequential execution for initial required nodes as well
          for (const child of initialRequired) {
              await expandNodeRecursively(child.id, nameSet, 0);
              await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          setAutoExpanding(false);
      }

    } catch (e) {
      console.error(e);
      setError("Failed to generate lab design. Please try a clearer description.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = (tree: LabNode) => {
    setRootNode(tree);
    rootNodeRef.current = tree;
    setSelectedNodeId(tree.id);
    setPrompt('');
    setAutoExpanding(false);
    setUrsHtml(null);
  };

  const handleNodeClick = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const currentRoot = rootNodeRef.current;
    if (!currentRoot) return;

    const targetNode = findNode(currentRoot, nodeId);
    if (!targetNode) return;

    // Only trigger expansion if it has no children and we haven't loaded them yet
    if (!targetNode.children || targetNode.children.length === 0) {
        setAutoExpanding(true);
        const allNames = collectNodeNamesFromTree(currentRoot);
        const nameSet = new Set<string>(allNames);
        
        await expandNodeRecursively(nodeId, nameSet, 0);
        setAutoExpanding(false);
    }
  };

  const handleGenerateURS = async () => {
    if (!rootNode) return;
    setIsGeneratingURS(true);
    try {
        const html = await generateLabURS(rootNode);
        setUrsHtml(html);
    } catch (e) {
        console.error(e);
        setError("Failed to generate URS document.");
    } finally {
        setIsGeneratingURS(false);
    }
  };

  const selectedNode = rootNode && selectedNodeId ? findNode(rootNode, selectedNodeId) : null;

  return (
    <div className="flex h-screen w-full bg-slate-900 text-white font-sans overflow-hidden relative">
      
      {/* Sidebar */}
      <div className="w-80 md:w-96 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col z-20 shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-500 rounded-lg">
                <Beaker className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">LabAutoNet</h1>
          </div>
          <p className="text-xs text-slate-400">AI-Powered Automation Architecture</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {!rootNode && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-300">
                        Design New System (AI)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Describe your problem to generate a custom tree.</p>
                    <textarea
                        className="w-full h-32 bg-slate-900 border border-slate-600 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                        placeholder="e.g., I need a system for automated cell culture plating involving a centrifuge and liquid handler..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button
                        onClick={handleInitialSearch}
                        disabled={loading || !prompt}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                    >
                        {loading ? <RotateCw className="animate-spin w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                        {loading ? 'Generating Design...' : 'Generate New Design'}
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-800 px-2 text-slate-500">Or Load Template</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {DEMO_SCENARIOS.map((scenario) => (
                         <button
                            key={scenario.id}
                            onClick={() => handleLoadDemo(scenario.tree)}
                            className="w-full p-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-indigo-500/50 rounded-xl text-left transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                {scenario.icon}
                            </div>
                            <div className="flex items-center gap-3 mb-1">
                                {scenario.icon}
                                <span className="font-semibold text-sm text-slate-200">{scenario.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 group-hover:text-slate-300 leading-tight pl-7">
                                {scenario.tree.description.substring(0, 60)}...
                            </p>
                        </button>
                    ))}
                </div>
            </div>
          )}

          {selectedNode && (
             <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border 
                                ${selectedNode.type === NodeType.REQUIRED ? 'bg-red-900/30 text-red-300 border-red-800' : 
                                selectedNode.type === NodeType.COMPATIBLE ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 
                                'bg-indigo-900/30 text-indigo-300 border-indigo-800'}`}>
                                {selectedNode.type}
                            </span>
                            {selectedNode.inInventory && (
                                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-green-900/30 text-green-300 border-green-800 flex items-center gap-1">
                                    <Package className="w-3 h-3" /> In Inventory
                                </span>
                            )}
                        </div>
                        {(selectedNode.isGenerating || autoExpanding) && (
                          <span className="flex items-center gap-1 text-xs text-indigo-400">
                            <RotateCw className="w-3 h-3 animate-spin" />
                            Processing...
                          </span>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-tight">{selectedNode.name}</h2>
                </div>

                <div className="prose prose-invert prose-sm">
                    <p className="text-slate-300 leading-relaxed">{selectedNode.description}</p>
                </div>

                {selectedNode.specs && Object.keys(selectedNode.specs).length > 0 && (
                     <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 shadow-inner">
                        <div className="flex items-center gap-2 mb-3 text-slate-500">
                            <Settings2 className="w-3 h-3" />
                            <h3 className="text-xs font-semibold uppercase">Suggested Specifications</h3>
                        </div>
                        <div className="space-y-2 bg-slate-950/30 p-2 rounded-lg">
                            {Object.entries(selectedNode.specs).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm items-baseline border-b border-slate-800/50 last:border-0 pb-1 last:pb-0">
                                    <span className="text-slate-400 capitalize text-xs">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-indigo-200 font-mono text-xs text-right ml-4 break-all">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-slate-300">Dependencies & Options</h3>
                        <span className="text-xs text-slate-500">{selectedNode.children?.length || 0} items</span>
                    </div>
                    
                    {selectedNode.children && selectedNode.children.length > 0 ? (
                        <ul className="space-y-2">
                            {selectedNode.children.map(child => (
                                <li key={child.id} 
                                    onClick={() => handleNodeClick(child.id)}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all group border
                                      ${child.type === NodeType.REQUIRED 
                                        ? 'bg-red-900/10 border-red-900/30 hover:bg-red-900/20' 
                                        : 'bg-slate-800/30 border-slate-800 hover:border-slate-600 hover:bg-slate-700/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {child.type === NodeType.REQUIRED ? (
                                          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                                            <AlertCircle className="w-3 h-3 text-red-400" />
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <Zap className="w-3 h-3 text-blue-400" />
                                          </div>
                                        )}
                                        <span className="text-sm text-slate-200">{child.name}</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                            <p className="text-xs text-slate-500 mb-2">No dependencies found yet.</p>
                            {!selectedNode.isGenerating && (
                                <button 
                                    onClick={() => handleNodeClick(selectedNode.id)}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                                >
                                    Click on the node in the graph to check requirements
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Generate Specification Button (Only when tree exists) */}
                {rootNode && (
                     <div className="pt-4 border-t border-slate-700">
                        <button
                            onClick={handleGenerateURS}
                            disabled={isGeneratingURS}
                            className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl font-medium text-slate-200 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isGeneratingURS ? (
                                <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
                            ) : (
                                <FileText className="w-4 h-4 text-indigo-400" />
                            )}
                            {isGeneratingURS ? 'Generating Document...' : 'Generate Specification (URS)'}
                        </button>
                     </div>
                )}
             </div>
          )}
          
           {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-start gap-2 mt-4">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                    <p className="text-xs text-red-200">{error}</p>
                </div>
            )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative">
        <LabTree 
            data={rootNode} 
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
        />
        
        {/* Legend overlay */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-2xl pointer-events-none select-none">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Legend</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white border border-slate-400"></span>
                    <span className="text-xs text-slate-300">Root Goal</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-900 border border-red-500"></span>
                    <span className="text-xs text-slate-300">Required</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-900 border border-blue-400"></span>
                    <span className="text-xs text-slate-300">Compatible</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
                    <span className="text-xs text-slate-300">In Inventory</span>
                </div>
                 <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span className="text-xs text-slate-300">Auto-Checked</span>
                </div>
            </div>
        </div>
      </div>

      {/* URS DOCUMENT MODAL */}
      {ursHtml && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
            <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 text-slate-800">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-lg">Generated Specification Preview</h3>
                    </div>
                    <button 
                        onClick={() => setUrsHtml(null)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
                    {/* Render Generated HTML Safely */}
                    <div 
                        className="urs-content"
                        dangerouslySetInnerHTML={{ __html: ursHtml }} 
                    />
                </div>
                 <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setUrsHtml(null)}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm"
                    >
                        Close
                    </button>
                    <button 
                         onClick={() => window.print()}
                         className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm shadow-sm"
                    >
                        Print / Save as PDF
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
