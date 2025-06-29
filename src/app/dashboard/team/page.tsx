'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserRole {
    id: string
    user_id: string
    role_type: string
    granted_at: string
    active: boolean
    permissions: any
    farm_id: string
    // Enhanced fields
    user_email?: string
    display_name?: string
    user_initials?: string
    is_current_user?: boolean
}

interface Invitation {
    id: string
    email: string
    role_type: string
    invited_at: string
    expires_at: string
    status: string
    invited_by?: string
    farm_id: string
}

const roleConfig = {
    gazda: {
        emoji: '👑',
        label: 'Gazda/Tulajdonos',
        color: 'text-purple-700 bg-purple-100 border-purple-200',
        description: 'Teljes hozzáférés minden funkcióhoz'
    },
    manager: {
        emoji: '💼',
        label: 'Manager',
        color: 'text-teal-700 bg-teal-100 border-teal-200',
        description: 'Állatok kezelése, jelentések, feladatok'
    },
    worker: {
        emoji: '🔨',
        label: 'Dolgozó',
        color: 'text-green-700 bg-green-100 border-green-200',
        description: 'Alapvető műveletek, feladatok végrehajtása'
    },
    observer: {
        emoji: '👁️',
        label: 'Megfigyelő',
        color: 'text-gray-700 bg-gray-100 border-gray-200',
        description: 'Csak olvasási jogosultság'
    }
}

export default function TeamPage() {
    const [users, setUsers] = useState<UserRole[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [loading, setLoading] = useState(true)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('worker')
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [currentFarmId, setCurrentFarmId] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        initializeTeamData()
    }, [])

    const initializeTeamData = async () => {
        try {
            await getCurrentUser()
            await loadTeamData()
        } catch (error) {
            console.error('Initialization error:', error)
        }
    }

    const getCurrentUser = async () => {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError) {
                console.warn('User context error:', userError)
                return
            }

            setCurrentUser(user)

            // Get user's farm_id
            if (user) {
                const { data: userRole } = await supabase
                    .from('user_roles')
                    .select('farm_id')
                    .eq('user_id', user.id)
                    .eq('active', true)
                    .single()

                if (userRole) {
                    setCurrentFarmId(userRole.farm_id)
                }
            }
        } catch (error) {
            console.error('Error getting current user:', error)
        }
    }

    const loadTeamData = async () => {
        try {
            console.log('🔄 Loading team data...')

            // Get current user for context
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError) {
                console.warn('Could not get user context:', userError)
            }

            // Load team members
            const { data: rolesData, error: rolesError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('active', true)

            if (rolesError) {
                console.error('Roles query error:', rolesError)
                throw rolesError
            }

            // Load pending invitations  
            const { data: invitesData, error: invitesError } = await supabase
                .from('farm_invitations')
                .select('*')
                .eq('status', 'pending')

            if (invitesError) {
                console.error('Invites query error:', invitesError)
                throw invitesError
            }

            // Enrich roles with user context
            const enrichedRoles = rolesData?.map(role => {
                const isCurrentUser = role.user_id === user?.id

                return {
                    ...role,
                    // Add user email for current user, placeholder for others
                    user_email: isCurrentUser ? user?.email : `felhasznalo-${role.user_id.slice(0, 8)}@farm.hu`,
                    // Add display name logic
                    display_name: isCurrentUser ? `Te (${roleConfig[role.role_type as keyof typeof roleConfig]?.label})` : 'Csapat tag',
                    // Add user avatar/initials logic
                    user_initials: isCurrentUser
                        ? user?.email?.charAt(0).toUpperCase()
                        : 'T',
                    // Mark current user
                    is_current_user: isCurrentUser
                }
            }) || []

            setUsers(enrichedRoles)
            setInvitations(invitesData || [])

            console.log('✅ Team data loaded successfully:', {
                users: enrichedRoles.length,
                invitations: invitesData?.length || 0
            })

        } catch (error) {
            console.error('❌ Error loading team data:', error)
        } finally {
            setLoading(false)
        }
    }

    const sendInvitation = async () => {
        try {
            if (!currentUser || !currentFarmId) {
                alert('Hiba: Nem található a felhasználó vagy gazdaság információ')
                return
            }

            if (!inviteEmail || !inviteEmail.includes('@')) {
                alert('Kérlek adj meg egy érvényes email címet')
                return
            }

            const { error } = await supabase
                .from('farm_invitations')
                .insert({
                    farm_id: currentFarmId,
                    email: inviteEmail,
                    role_type: inviteRole,
                    invited_by: currentUser.id,
                    status: 'pending'
                })

            if (error) throw error

            alert('✅ Meghívó sikeresen elküldve!')
            setShowInviteModal(false)
            setInviteEmail('')
            setInviteRole('worker')
            loadTeamData()
        } catch (error: any) {
            console.error('Invitation error:', error)
            alert('❌ Hiba a meghívó küldése során: ' + error.message)
        }
    }

    const revokeUser = async (roleId: string, userName: string) => {
        if (!confirm(`Biztosan visszavonod ${userName} hozzáférését?`)) return

        try {
            const { error } = await supabase
                .from('user_roles')
                .update({ active: false })
                .eq('id', roleId)

            if (error) throw error

            alert('✅ Felhasználó hozzáférése visszavonva')
            loadTeamData()
        } catch (error: any) {
            console.error('Revoke error:', error)
            alert('❌ Hiba: ' + error.message)
        }
    }

    const revokeInvitation = async (inviteId: string, email: string) => {
        if (!confirm(`Biztosan visszavonod a(z) ${email} meghívóját?`)) return

        try {
            const { error } = await supabase
                .from('farm_invitations')
                .update({ status: 'revoked' })
                .eq('id', inviteId)

            if (error) throw error

            alert('✅ Meghívó visszavonva')
            loadTeamData()
        } catch (error: any) {
            console.error('Revoke invitation error:', error)
            alert('❌ Hiba: ' + error.message)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {[1,2,3].map(i => (
                                <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="space-y-4">
                                {[1,2].map(i => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center">
                        <span className="text-4xl mr-4">👥</span>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Csapat Kezelése</h1>
                            <p className="mt-2 text-gray-600">Felhasználók és jogosultságok kezelése</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
                    >
                        <span className="mr-2">➕</span>
                        Új felhasználó meghívása
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center">
                            <span className="text-3xl mr-4">✅</span>
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Aktív tagok</p>
                                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center">
                            <span className="text-3xl mr-4">📧</span>
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Függő meghívók</p>
                                <p className="text-3xl font-bold text-gray-900">{invitations.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center">
                            <span className="text-3xl mr-4">👑</span>
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Gazda/Tulajdonos</p>
                                <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role_type === 'gazda').length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Team Members */}
                <div className="bg-white rounded-lg shadow-sm border mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <span className="text-2xl mr-3">✅</span>
                            Aktív csapattagok ({users.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {users.length === 0 ? (
                            <div className="p-12 text-center">
                                <span className="text-6xl mb-4 block">👥</span>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Még nincsenek csapattagok</h3>
                                <p className="text-gray-600">Hívj meg új tagokat a csapathoz!</p>
                            </div>
                        ) : (
                            users.map((user) => {
                                const roleInfo = roleConfig[user.role_type as keyof typeof roleConfig]

                                return (
                                    <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                {/* User Avatar */}
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                                                    user.is_current_user ? 'bg-green-600' : 'bg-gray-500'
                                                }`}>
                                                    {user.user_initials}
                                                </div>

                                                {/* User Info */}
                                                <div>
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <span className="text-lg font-semibold text-gray-900">
                                                            {user.display_name}
                                                        </span>
                                                        {user.is_current_user && (
                                                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full border border-green-200">
                                                                Te
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-gray-600 mb-2">{user.user_email}</div>
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleInfo.color}`}>
                                                            <span className="mr-2">{roleInfo.emoji}</span>
                                                            {roleInfo.label}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-2">{roleInfo.description}</div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-500 mb-1">
                                                        Csatlakozott
                                                    </div>
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {new Date(user.granted_at).toLocaleDateString('hu-HU')}
                                                    </div>
                                                </div>
                                                {!user.is_current_user && (
                                                    <button
                                                        onClick={() => revokeUser(user.id, user.display_name || 'felhasználó')}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-3 rounded-lg transition-colors"
                                                        title="Hozzáférés visszavonása"
                                                    >
                                                        <span className="text-xl">🗑️</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                <span className="text-2xl mr-3">📧</span>
                                Függőben lévő meghívók ({invitations.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {invitations.map((invite) => {
                                const roleInfo = roleConfig[invite.role_type as keyof typeof roleConfig]

                                return (
                                    <div key={invite.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 border-dashed ${roleInfo.color}`}>
                                                    {roleInfo.emoji}
                                                </div>
                                                <div>
                                                    <div className="text-lg font-semibold text-gray-900 mb-2">{invite.email}</div>
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleInfo.color}`}>
                                                            <span className="mr-2">{roleInfo.emoji}</span>
                                                            {roleInfo.label}
                                                        </div>
                                                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full border border-orange-200">
                                                            Függőben
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Lejár: {new Date(invite.expires_at).toLocaleDateString('hu-HU')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => revokeInvitation(invite.id, invite.email)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-3 rounded-lg transition-colors"
                                                    title="Meghívó visszavonása"
                                                >
                                                    <span className="text-xl">🗑️</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                                        <span className="text-3xl">➕</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Új felhasználó meghívása</h3>
                                        <p className="text-gray-600 mt-1">Adj hozzá új tagot a csapathoz</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            📧 Email cím
                                        </label>
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                            placeholder="felhasznalo@email.com"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            👤 Szerepkör
                                        </label>
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                                        >
                                            <option value="worker">🔨 Dolgozó</option>
                                            <option value="manager">💼 Manager</option>
                                            <option value="observer">👁️ Megfigyelő</option>
                                            <option value="gazda">👑 Gazda/Tulajdonos</option>
                                        </select>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {roleConfig[inviteRole as keyof typeof roleConfig]?.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 mt-8">
                                    <button
                                        onClick={() => {
                                            setShowInviteModal(false)
                                            setInviteEmail('')
                                            setInviteRole('worker')
                                        }}
                                        className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        <span className="mr-2">❌</span>
                                        Mégse
                                    </button>
                                    <button
                                        onClick={sendInvitation}
                                        disabled={!inviteEmail || !inviteEmail.includes('@')}
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        <span className="mr-2">📨</span>
                                        Meghívó küldése
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}