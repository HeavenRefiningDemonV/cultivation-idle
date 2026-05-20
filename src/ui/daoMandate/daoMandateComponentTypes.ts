import type {
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
  DaoMandateRoute,
} from '../../systems/ui/daoMandate/index.js';

export type DaoMandateRouteActionHandler = (route: DaoMandateRoute) => void;
export type DaoMandateDismissHandler = (id: string) => void;

export type DaoMandateUiDensity =
  | DaoMandateGuidanceProfile
  | 'compact'
  | 'default'
  | 'expanded';

export type DaoMandateUiVariant =
  | 'compact'
  | 'default'
  | 'hero'
  | 'module'
  | 'dense';

export type DaoMandateHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface BaseDaoMandateComponentProps {
  className?: string;
  profile?: DaoMandateGuidanceProfile;
  motionMode?: DaoMandateEffectiveMotionMode;
  onRouteAction?: DaoMandateRouteActionHandler;
}
