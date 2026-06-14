/**
 * Centralized icon wrapper. Spec §1.4 mandates Tabler Icons (outline only).
 * Tabler is not yet bundled, so we map each semantic name to the closest
 * Ionicons *outline* variant here. When Tabler RN is added, only this file
 * changes — screens import `Icon` and never reference Ionicons directly.
 */
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export type IconName =
  | 'home'
  | 'search'
  | 'heart'
  | 'heart-plus'
  | 'bell'
  | 'user'
  | 'menu'
  | 'share'
  | 'bookmark'
  | 'bookmark-filled'
  | 'verified'
  | 'settings'
  | 'language'
  | 'eye'
  | 'eye-off'
  | 'moon'
  | 'headset'
  | 'logout'
  | 'trash'
  | 'lock'
  | 'back'
  | 'edit'
  | 'copy'
  | 'chevron'
  | 'check'
  | 'check-circle'
  | 'close'
  | 'close-circle'
  | 'crown'
  | 'star'
  | 'ribbon'
  | 'info'
  | 'chat'
  | 'camera'
  | 'phone'
  | 'whatsapp';

const MAP: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  search: 'search-outline',
  heart: 'heart-outline',
  'heart-plus': 'heart-circle-outline',
  bell: 'notifications-outline',
  user: 'person-outline',
  menu: 'menu-outline',
  share: 'share-social-outline',
  bookmark: 'bookmark-outline',
  'bookmark-filled': 'bookmark',
  verified: 'shield-checkmark-outline',
  settings: 'settings-outline',
  language: 'language-outline',
  eye: 'eye-outline',
  'eye-off': 'eye-off-outline',
  moon: 'moon-outline',
  headset: 'headset-outline',
  logout: 'log-out-outline',
  trash: 'trash-outline',
  lock: 'lock-closed-outline',
  back: 'arrow-back-outline',
  edit: 'pencil-outline',
  copy: 'copy-outline',
  chevron: 'chevron-forward-outline',
  check: 'checkmark-outline',
  'check-circle': 'checkmark-circle-outline',
  close: 'close-outline',
  'close-circle': 'close-circle-outline',
  crown: 'ribbon-outline',
  star: 'star-outline',
  ribbon: 'ribbon-outline',
  info: 'information-circle-outline',
  chat: 'chatbubbles-outline',
  camera: 'camera-outline',
  phone: 'call-outline',
  whatsapp: 'logo-whatsapp',
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 18, color = colors.midBrown }: IconProps) {
  return <Ionicons name={MAP[name]} size={size} color={color} />;
}
