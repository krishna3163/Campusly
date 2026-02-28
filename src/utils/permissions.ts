// ===================================================================
// Campusly v3.0 — Group Permission Enforcement Utility
// Client-side permission checking for role-based group access.
// Backend enforcement is handled by RLS policies + edge functions.
// ===================================================================

import type { GroupRoleType, GroupPermission } from '../types/messaging';

/**
 * Master permission matrix.
 * Each role maps to an array of allowed permissions.
 * Roles inherit NO permissions from lower roles — each is explicit.
 */
const PERMISSION_MAP: Record<GroupRoleType, GroupPermission[]> = {
    owner: [
        'delete_group', 'assign_roles', 'remove_admins',
        'add_assignments', 'add_events', 'pin_messages',
        'remove_members', 'moderate_chat', 'post_updates',
        'delete_messages', 'warn_users', 'manage_settings',
    ],
    admin: [
        'add_assignments', 'add_events', 'pin_messages',
        'remove_members', 'moderate_chat', 'post_updates',
        'delete_messages', 'warn_users',
    ],
    co_admin: [
        'moderate_chat', 'add_events', 'delete_messages',
    ],
    class_representative: [
        'post_updates', 'add_assignments',
    ],
    placement_coordinator: [
        'post_updates', 'add_events',
    ],
    moderator: [
        'delete_messages', 'warn_users',
    ],
    member: [],
};

/**
 * Role hierarchy for comparison.
 * Higher number = higher authority.
 */
const ROLE_HIERARCHY: Record<GroupRoleType, number> = {
    owner: 100,
    admin: 80,
    co_admin: 60,
    class_representative: 40,
    placement_coordinator: 40,
    moderator: 30,
    member: 10,
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: GroupRoleType, permission: GroupPermission): boolean {
    return PERMISSION_MAP[role]?.includes(permission) ?? false;
}

/**
 * Check if roleA outranks roleB in hierarchy.
 */
export function outranks(roleA: GroupRoleType, roleB: GroupRoleType): boolean {
    return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

/**
 * Check if a user can assign a target role.
 * Rule: Can only assign roles strictly below their own.
 */
export function canAssignRole(assignerRole: GroupRoleType, targetRole: GroupRoleType): boolean {
    if (!hasPermission(assignerRole, 'assign_roles')) return false;
    return outranks(assignerRole, targetRole);
}

/**
 * Check if a user can remove another user from the group.
 * Rule: Can only remove users with strictly lower roles.
 */
export function canRemoveUser(removerRole: GroupRoleType, targetRole: GroupRoleType): boolean {
    if (!hasPermission(removerRole, 'remove_members')) return false;
    return outranks(removerRole, targetRole);
}

// Convenience helpers
export const canCreateAssignment = (role: GroupRoleType) => hasPermission(role, 'add_assignments');
export const canCreateEvent = (role: GroupRoleType) => hasPermission(role, 'add_events');
export const canPinMessage = (role: GroupRoleType) => hasPermission(role, 'pin_messages');
export const canDeleteMessage = (role: GroupRoleType) => hasPermission(role, 'delete_messages');
export const canModerateChat = (role: GroupRoleType) => hasPermission(role, 'moderate_chat');
export const canDeleteGroup = (role: GroupRoleType) => hasPermission(role, 'delete_group');
export const canManageSettings = (role: GroupRoleType) => hasPermission(role, 'manage_settings');

/**
 * Get a human-readable label for a role.
 */
export function getRoleLabel(role: GroupRoleType): string {
    const labels: Record<GroupRoleType, string> = {
        owner: 'Owner',
        admin: 'Admin',
        co_admin: 'Co-Admin',
        class_representative: 'Class Rep',
        placement_coordinator: 'Placement Coordinator',
        moderator: 'Moderator',
        member: 'Member',
    };
    return labels[role] || 'Member';
}

/**
 * Get badge color for a role (Tailwind classes).
 */
export function getRoleBadgeColor(role: GroupRoleType): string {
    const colors: Record<GroupRoleType, string> = {
        owner: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        admin: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
        co_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        class_representative: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        placement_coordinator: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        moderator: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        member: 'bg-white/5 text-campus-muted border-white/10',
    };
    return colors[role] || colors.member;
}

/**
 * Get all permissions for a role (for display purposes).
 */
export function getPermissionsForRole(role: GroupRoleType): GroupPermission[] {
    return PERMISSION_MAP[role] || [];
}

/**
 * Get all available roles (for dropdowns, etc).
 */
export function getAllRoles(): GroupRoleType[] {
    return ['owner', 'admin', 'co_admin', 'class_representative', 'placement_coordinator', 'moderator', 'member'];
}

/**
 * Get assignable roles for a given assigner role.
 */
export function getAssignableRoles(assignerRole: GroupRoleType): GroupRoleType[] {
    return getAllRoles().filter(r => r !== assignerRole && outranks(assignerRole, r));
}
