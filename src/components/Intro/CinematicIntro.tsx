import React from 'react';
import { ArtisanCraftsmanIntro } from './ArtisanCraftsmanIntro';

interface CinematicIntroProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  return <ArtisanCraftsmanIntro onComplete={onComplete} />;
};
