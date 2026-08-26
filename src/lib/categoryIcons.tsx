import React from 'react';
import {
  Code,
  Activity,
  Scale,
  Cpu,
  TrendingUp,
  FlaskConical,
  Landmark,
  Binary,
  Layers,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export const getCategoryIcon = (category?: string): LucideIcon => {
  switch (category) {
    case 'Computer Science':
      return Code;
    case 'Medicine & Health':
      return Activity;
    case 'Law & Governance':
      return Scale;
    case 'Physics & Engineering':
      return Cpu;
    case 'Business & Economics':
      return TrendingUp;
    case 'Natural Sciences':
      return FlaskConical;
    case 'Humanities & History':
      return Landmark;
    case 'Mathematics':
      return Binary;
    case 'All Categories':
      return Sparkles;
    case 'General':
    default:
      return Layers;
  }
};
