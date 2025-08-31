'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import {
  Shield,
  CreditCard,
  Users,
  FileText,
  TrendingUp,
  ArrowRight,
  Star,
  Check,
  Github,
  Twitter,
  Linkedin,
  Globe,
  Zap,
  Lock,
  DollarSign,
  BarChart3,
  Menu,
  X
} from 'lucide-react'
import { useDAOStats, useUserData, useDAOEvents } from '@/hooks/useDAO'
import { formatEther } from '@/lib/utils'
import NotificationCenter from '@/components/NotificationCenter'
import { useState } from 'react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const stats = useDAOStats()
  const userData = useUserData()
  useDAOEvents() // Start listening for events

  const features = [
    {
      name: 'Privacy-First Lending',
      description: 'Confidential loans with zero-knowledge proofs and encrypted voting to protect member privacy.',
      icon: Lock,
      gradient: 'from-purple-500 to-indigo-500',
    },
    {
      name: 'Automated P2P Loans',
      description: 'Smart contract-based lending with automatic approval, disbursement, and interest calculation.',
      icon: Zap,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      name: 'Democratic Governance',
      description: 'Member-driven decision making with ENS-weighted voting and transparent proposal system.',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Document Storage',
      description: 'Decentralized IPFS storage for loan agreements and KYC documentation with encryption.',
      icon: FileText,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      name: 'Yield Generation',
      description: 'Treasury optimization through Symbiotic restaking with automatic yield distribution.',
      icon: TrendingUp,
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      name: 'Real-time Updates',
      description: 'Live notifications and activity feeds keeping you informed of all DAO activities.',
      icon: Globe,
      gradient: 'from-violet-500 to-purple-500',
    },
  ]

  const benefits = [
    'Transparent and Decentralized',
    'Privacy-Preserving Technology',
    'Automated Smart Contracts',
    'Community Governance',
    'Yield-Generating Treasury',
    'Real-time Notifications'
  ]

  const teamMembers = [
    {
      name: 'Alex Thompson',
      role: 'Lead Developer & Founder',
      avatar: '/api/placeholder/100/100',
      description: 'Full-stack blockchain developer with 5+ years in DeFi. Previously at Compound and Aave.',
      social: {
        twitter: '#',
        github: '#',
        linkedin: '#'
      }
    },
    {
      name: 'Sarah Chen',
      role: 'Smart Contract Architect',
      avatar: '/api/placeholder/100/100', 
      description: 'Security-focused Solidity expert. Former security auditor at OpenZeppelin.',
      social: {
        twitter: '#',
        github: '#',
        linkedin: '#'
      }
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Product Designer & UX Lead',
      avatar: '/api/placeholder/100/100',
      description: 'Design leader focused on making DeFi accessible. Ex-Coinbase Design team.',
      social: {
        twitter: '#',
        github: '#',
        linkedin: '#'
      }
    },
    {
      name: 'Emily Watson',
      role: 'Community & Growth Manager',
      avatar: '/api/placeholder/100/100',
      description: 'Community building expert with deep roots in the DeFi ecosystem. Previously at MakerDAO.',
      social: {
        twitter: '#',
        github: '#',
        linkedin: '#'
      }
    },
  ]

  const testimonials = [
    {
      content: "UnifiedLendingDAO revolutionized how I access capital. The privacy features give me confidence in sensitive transactions.",
      author: "Alex Chen",
      role: "DeFi Entrepreneur",
    },
    {
      content: "The automated approval system and yield generation make this the most advanced DAO I've participated in.",
      author: "Sarah Martinez",
      role: "Crypto Investor",
    },
    {
      content: "ENS integration and document storage provide a professional lending experience that traditional banks can't match.",
      author: "Michael Thompson",
      role: "Web3 Developer",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                UnifiedLendingDAO
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/loans" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Loans
              </Link>
              <Link href="/governance" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Governance
              </Link>
              <Link href="/treasury" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Treasury
              </Link>
              <Link href="/privacy" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Privacy
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              {userData.isConnected && userData.isMember && (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                      Dashboard
                    </Button>
                  </Link>
                  <NotificationCenter />
                </>
              )}
              <ConnectButton />
              
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100">
            <div className="space-y-1 px-4 pb-3 pt-2">
              <Link
                href="/loans"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Loans
              </Link>
              <Link
                href="/governance"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Governance
              </Link>
              <Link
                href="/treasury"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Treasury
              </Link>
              <Link
                href="/privacy"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Privacy
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              🚀 Next Generation DeFi Lending
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              The Future of{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Decentralized Lending
              </span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
              Join the most advanced peer-to-peer lending DAO with privacy features, 
              automated governance, and yield generation through restaking.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              {userData.isConnected ? (
                userData.isMember ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="w-full sm:w-auto px-8 py-3 text-base">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto px-8 py-3 text-base">
                      Become a Member
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )
              ) : (
                <>
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <Button 
                        onClick={openConnectModal} 
                        size="lg" 
                        className="w-full sm:w-auto px-8 py-3 text-base"
                      >
                        Connect Wallet
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    )}
                  </ConnectButton.Custom>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3 text-base">
                    Learn More
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 opacity-20 blur-3xl" />
        </div>
      </section>

      {/* Stats Section */}
      {stats.initialized && (
        <section className="py-16 bg-white border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-3">
                Our Impact in Numbers
              </h2>
              <p className="text-lg text-gray-600 mx-auto">
                Driving decentralized finance forward through community-powered lending.
              </p>
            </div>
            
            <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                  <Users className="h-8 w-8 text-primary-600" aria-hidden="true" />
                </div>
                <dt className="text-4xl font-bold text-primary-600">{stats.totalMembers}</dt>
                <dd className="mt-2 text-base font-medium text-gray-600">Total Members</dd>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                  <Shield className="h-8 w-8 text-green-600" aria-hidden="true" />
                </div>
                <dt className="text-4xl font-bold text-green-600">{stats.activeMembers}</dt>
                <dd className="mt-2 text-base font-medium text-gray-600">Active Members</dd>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <BarChart3 className="h-8 w-8 text-blue-600" aria-hidden="true" />
                </div>
                <dt className="text-4xl font-bold text-blue-600">{formatEther(stats.treasuryBalance)} ETH</dt>
                <dd className="mt-2 text-base font-medium text-gray-600">Treasury Balance</dd>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                  <CreditCard className="h-8 w-8 text-orange-600" aria-hidden="true" />
                </div>
                <dt className="text-4xl font-bold text-orange-600">{stats.totalLoans}</dt>
                <dd className="mt-2 text-base font-medium text-gray-600">Loans Funded</dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-6 px-3 py-1" variant="secondary">About UnifiedLendingDAO</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-6">
                Redefining Trustless, Private Lending
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                UnifiedLendingDAO is a privacy-first, decentralized lending protocol built for communities.
                We combine trustless smart contracts, encrypted document storage, zero-knowledge voting,
                and real-time transparency to deliver a best-in-class experience for borrowers and lenders.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-10">
                {benefits.map((item) => (
                  <div key={item} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-base text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto px-6">
                    Get Started
                  </Button>
                </Link>
                <Link href="/governance">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-6">
                    Explore Governance
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 lg:mt-0">
              {features.slice(0,4).map((f) => {
                const Icon = f.icon
                return (
                  <Card key={f.name} className="border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${f.gradient} mb-4 flex items-center justify-center text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{f.name}</h4>
                      <p className="text-sm leading-relaxed text-gray-600">{f.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="secondary" className="mb-3">Our Platform</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl mb-6">
              Advanced Features for Modern DeFi
            </h2>
            <p className="text-xl leading-8 text-gray-600 mx-auto">
              Built with cutting-edge technology to provide the most comprehensive 
              and secure lending experience in DeFi.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.name} className="border border-gray-200 hover:shadow-xl transition-all duration-300 h-full">
                  <CardHeader className="pb-2">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6 flex items-center justify-center text-white shadow-sm`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <CardTitle className="text-xl font-bold mb-2">{feature.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="secondary" className="mb-3">Testimonials</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
              Trusted by DeFi Professionals
            </h2>
            <p className="text-xl leading-8 text-gray-600">
              See what our community members have to say about their experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg leading-relaxed text-gray-700 mb-6">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>
                  <div className="border-t border-gray-100 pt-6">
                    <div className="font-semibold text-lg text-gray-900">{testimonial.author}</div>
                    <div className="text-base text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="secondary" className="mb-3">Our Team</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
              Builders Behind the Protocol
            </h2>
            <p className="text-xl leading-8 text-gray-600 mx-auto">
              A diverse team of engineers, designers, and community leaders dedicated to building secure, inclusive DeFi.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <Card key={member.name} className="border border-gray-200 hover:shadow-lg transition-shadow text-center">
                <CardContent className="p-6">
                  <Avatar className="mx-auto mb-6 h-24 w-24">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="text-lg font-semibold">
                      {member.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </AvatarFallback>
                  </Avatar>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h4>
                  <p className="text-sm text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-sm leading-relaxed text-gray-600 mb-6">{member.description}</p>
                  <div className="flex items-center justify-center space-x-4">
                    <a href={member.social.twitter} className="text-gray-400 hover:text-blue-500 transition-colors">
                      <Twitter className="h-5 w-5" />
                    </a>
                    <a href={member.social.github} className="text-gray-400 hover:text-gray-900 transition-colors">
                      <Github className="h-5 w-5" />
                    </a>
                    <a href={member.social.linkedin} className="text-gray-400 hover:text-blue-600 transition-colors">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl mb-6">
              Ready to Join the Future of Lending?
            </h2>
            <p className="mx-auto text-xl leading-8 text-blue-100 mb-10">
              Connect your wallet and become part of the most advanced lending DAO on Ethereum.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {userData.isConnected ? (
                userData.isMember ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 text-base font-semibold">
                      Access Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 text-base font-semibold">
                      Become a Member
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )
              ) : (
                <>
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <Button 
                        onClick={openConnectModal} 
                        size="lg" 
                        className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 text-base font-semibold"
                      >
                        Connect Wallet
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    )}
                  </ConnectButton.Custom>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 px-8 py-3 text-base font-semibold"
                  >
                    Learn More
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="h-[40rem] w-[40rem] rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">UnifiedLendingDAO</h3>
                </div>
                <p className="text-base leading-relaxed text-gray-400 mb-6 max-w-md">
                  The most advanced peer-to-peer lending DAO with privacy features, 
                  automated governance, and yield generation.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Twitter className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Github className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Globe className="h-6 w-6" />
                  </a>
                </div>
              </div>
              
              <div>
                <h4 className="text-base font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-3">
                  <li><Link href="/loans" className="text-gray-400 hover:text-white text-sm transition-colors">Loans</Link></li>
                  <li><Link href="/governance" className="text-gray-400 hover:text-white text-sm transition-colors">Governance</Link></li>
                  <li><Link href="/treasury" className="text-gray-400 hover:text-white text-sm transition-colors">Treasury</Link></li>
                  <li><Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-base font-semibold text-white mb-4">Resources</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">GitHub</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Discord</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Support</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} UnifiedLendingDAO. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
