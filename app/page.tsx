'use client'

import { useRouter } from 'next/navigation'
import { Shield, Users, Smartphone, Lock, ArrowRight, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LandingPage() {
  const router = useRouter()

  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center gap-6 px-4 py-20 sm:py-32">
        <div className="flex flex-col items-center gap-4 text-center max-w-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground text-balance">
            Device Protection Portal
          </h1>
          <p className="text-lg text-muted-foreground text-pretty max-w-xl">
            Comprehensive device protection for phones and gadgets. Enroll customers, manage subscriptions, and protect what matters most.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto sm:justify-center mt-8">
          <Button
            onClick={() => router.push('/auth/agent')}
            size="lg"
            className="gap-2"
          >
            Agent Portal <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => router.push('/auth/customer')}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            Customer Login <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="flex flex-col gap-8 px-4 py-20 sm:py-28 bg-muted/30">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            Explore the Demo
          </h2>
          <p className="text-muted-foreground text-pretty">
            Explore the enrollment and device-management workflow
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto w-full">
          <Card>
            <CardHeader>
              <Building2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>For Agents</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Easy customer enrollment</p>
              <p>Manage subscriptions</p>
              <p>Track coverage plans</p>
              <p>Cancel subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>For Customers</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Add your devices</p>
              <p>Track coverage</p>
              <p>View enrolled devices</p>
              <p>Manage your device list</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Demo Safeguards</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Simulated payments</p>
              <p>Secure authentication</p>
              <p>Signed session cookies</p>
              <p>Synthetic demo data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Smartphone className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Device Coverage</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Phones</p>
              <p>Laptops</p>
              <p>Tablets & more</p>
              <p>Multi-device support</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Flexible Plans</h3>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Phone Plan - $9.99/mo</p>
              <p>Gadget+Phone - $19.99/mo</p>
              <p>Choose what you need</p>
              <p>Cancel anytime</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Demo Workflow</h3>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Choose a role</p>
              <p>Enroll a customer</p>
              <p>Add a device</p>
              <p>Review and cancel</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="flex flex-col items-center gap-6 px-4 py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground">
            Choose your role to continue
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto sm:justify-center">
          <Button
            onClick={() => router.push('/auth/agent')}
            size="lg"
            className="gap-2"
          >
            I am an Agent <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => router.push('/auth/customer')}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            I am a Customer <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  )
}
