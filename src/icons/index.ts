import shieldSvg from './shield.svg';
import keyRoundSvg from './key-round.svg';
import layoutDashboardSvg from './layout-dashboard.svg';
import lockSvg from './lock.svg';
import scrollTextSvg from './scroll-text.svg';
import userSvg from './user.svg';
import logOutSvg from './log-out.svg';
import pencilSvg from './pencil.svg';
import trashSvg from './trash-2.svg';
import eyeSvg from './eye.svg';
import eyeOffSvg from './eye-off.svg';
import copySvg from './copy.svg';
import chevronUpSvg from './chevron-up.svg';
import plusSvg from './plus.svg';
import searchSvg from './search.svg';
import keySvg from './key.svg';
import databaseSvg from './database.svg';
import terminalSvg from './terminal.svg';
import alertTriangleSvg from './alert-triangle.svg';
import checkCircleSvg from './check-circle.svg';
import xCircleSvg from './x-circle.svg';
import infoSvg from './info.svg';
import xSvg from './x.svg';
import chevronLeftSvg from './chevron-left.svg';
import chevronRightSvg from './chevron-right.svg';

export const icons = {
  shield: shieldSvg,
  keyRound: keyRoundSvg,
  layoutDashboard: layoutDashboardSvg,
  lock: lockSvg,
  scrollText: scrollTextSvg,
  user: userSvg,
  logOut: logOutSvg,
  pencil: pencilSvg,
  trash: trashSvg,
  eye: eyeSvg,
  eyeOff: eyeOffSvg,
  copy: copySvg,
  chevronUp: chevronUpSvg,
  plus: plusSvg,
  search: searchSvg,
  key: keySvg,
  database: databaseSvg,
  terminal: terminalSvg,
  alertTriangle: alertTriangleSvg,
  checkCircle: checkCircleSvg,
  xCircle: xCircleSvg,
  info: infoSvg,
  x: xSvg,
  chevronLeft: chevronLeftSvg,
  chevronRight: chevronRightSvg,
} as const;

export function icon(name: keyof typeof icons, size: 'sm' | 'md' | 'lg' | 'xl' = 'md'): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = `icon icon--${size}`;
  span.style.maskImage = `url("${icons[name]}")`;
  span.style.webkitMaskImage = `url("${icons[name]}")`;
  span.setAttribute('aria-hidden', 'true');
  return span;
}

export function setIcon(element: HTMLElement, name: keyof typeof icons): void {
  element.style.maskImage = `url("${icons[name]}")`;
  element.style.webkitMaskImage = `url("${icons[name]}")`;
}

