import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from './BrandLogo'

function Navbar() {
  const navigate = useNavigate()
  const [openProfile, setOpenProfile] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    role: '',
  })

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from localStorage or API
  useEffect(() => {
    try {
      // First try to get from localStorage (set during login)
      const storedUser = localStorage.getItem('edutrack_user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        const profile = {
          id: user.id,
          name: user.name || 'User',
          email: user.email,
          role: user.role,
        }
        setProfile(profile)
        setProfileForm(profile)
      }
    } catch (error) {
      console.error('Error loading profile from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFormChange = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }))
  }

  const handleSaveProfile = () => {
    const updatedProfile = {
      ...profile,
      name: profileForm.name.trim() || profile.name,
      email: profileForm.email.trim() || profile.email,
    }

    setProfile(updatedProfile)
    try {
      localStorage.setItem('edutrack_user', JSON.stringify(updatedProfile))
    } catch { }
    setIsEditingProfile(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('edutrack_token')
    localStorage.removeItem('edutrack_user')
    localStorage.removeItem('edutrack_role')
    navigate('/')
  }

  if (loading || !profile) {
    return (
      <header className="sticky top-0 z-20 border-b border-edu-blue/15 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo imageClassName="h-12 w-auto sm:h-14" priority />
            <div>
              <h2 className="text-lg font-semibold text-edu-navy">EduTrack</h2>
              <p className="text-xs text-edu-blue/85">Academic Performance & Engagement</p>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-20 border-b border-edu-blue/15 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo imageClassName="h-12 w-auto sm:h-14" priority />
          <div>
            <h2 className="text-lg font-semibold text-edu-navy">EduTrack</h2>
            <p className="text-xs text-edu-blue/85">Academic Performance & Engagement</p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenProfile((state) => !state)}
            className="flex items-center gap-2 rounded-soft border border-edu-blue/20 bg-white/90 px-3 py-2 text-sm text-edu-navy shadow-soft transition hover:-translate-y-0.5 hover:bg-edu-blue/10"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-edu-teal/25 text-xs font-semibold">
              {profile.name?.[0] || 'U'}
            </span>
            <span className="hidden sm:block">{profile.name}</span>
            <span>▾</span>
          </button>

          {openProfile && (
            <div className="absolute right-0 mt-2 w-80 rounded-soft border border-edu-blue/20 bg-white/95 p-4 shadow-[0_16px_40px_rgba(33,93,135,0.2)] backdrop-blur-sm">
              <div className="flex flex-col items-center border-b border-edu-blue/10 pb-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-edu-blue/35 to-edu-teal/30 text-4xl font-medium text-edu-navy">
                  {profile.name?.[0] || 'U'}
                </div>
                <p className="mt-3 text-2xl font-semibold text-edu-navy">{profile.name}</p>
                <p className="mt-1 text-sm text-edu-blue">{profile.email}</p>
                {profile.role && (
                  <p className="mt-1 text-xs uppercase tracking-wide text-edu-blue/70">{profile.role}</p>
                )}
              </div>

              {isEditingProfile ? (
                <div className="mt-3 space-y-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-edu-blue">Username</span>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(event) => handleFormChange('name', event.target.value)}
                      className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-edu-blue">Email</span>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => handleFormChange('email', event.target.value)}
                      className="w-full rounded-lg border border-edu-blue/20 px-3 py-2 text-sm text-edu-navy outline-none transition focus:border-edu-teal focus:ring-2 focus:ring-edu-teal/25"
                    />
                  </label>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="flex-1 rounded-lg bg-edu-teal px-3 py-2 text-sm font-medium text-white transition hover:bg-edu-blue"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileForm(profile)
                        setIsEditingProfile(false)
                      }}
                      className="flex-1 rounded-lg border border-edu-blue/20 px-3 py-2 text-sm font-medium text-edu-navy transition hover:bg-edu-blue/8"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-edu-navy transition hover:bg-edu-blue/12"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-edu-navy transition hover:bg-edu-blue/12"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar