export type ApothecaryService = {
  id: string;
  name: string;
  description: string;
  actionLabel: string;
};

export const apothecaryServices: ApothecaryService[] = [
  {
    id: 'service_meridian_diagnosis',
    name: 'Meridian Diagnosis',
    description: 'Get a plain-language read of your current strengths and weaknesses.',
    actionLabel: 'Diagnose',
  },
  {
    id: 'service_refinement_conversion',
    name: 'Refinement Conversion',
    description: 'Convert low-tier materials into higher-tier refinements.',
    actionLabel: 'Open Conversion',
  },
  {
    id: 'service_emergency_pack_order',
    name: 'Emergency Pack Order',
    description: 'Order a rescue pack. Delivery is timed.',
    actionLabel: 'Order Emergency Pack',
  },
];
