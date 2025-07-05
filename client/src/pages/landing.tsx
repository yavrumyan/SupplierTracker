import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Microchip, Shield, Search, Users, BarChart, Zap } from "lucide-react";
import supHubLogo from "@assets/SupHub_1751730375430.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={supHubLogo} 
              alt="SupHub Logo" 
              className="w-16 h-16 mr-4 rounded-2xl"
            />
            <h1 className="text-5xl font-bold text-foreground">SupHub</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Your comprehensive supplier management platform for computer hardware sales. 
            Streamline procurement, manage relationships, and grow your business.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="px-8 py-4 text-lg"
          >
            <Shield className="mr-2 h-5 w-5" />
            Sign In to Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Search className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Advanced Search & Filtering</CardTitle>
              <CardDescription>
                Find suppliers by country, category, brand, reputation, and working style. 
                Discover the perfect partners for your business needs.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Supplier Management</CardTitle>
              <CardDescription>
                Comprehensive supplier profiles with contact info, capabilities, 
                price lists, and communication history all in one place.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                Create, track, and manage orders with automatic cost calculations. 
                Export data seamlessly for your accounting systems.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Automated Inquiries</CardTitle>
              <CardDescription>
                Send inquiries to multiple suppliers simultaneously via WhatsApp 
                and email. Save time and get faster responses.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Price List Management</CardTitle>
              <CardDescription>
                Upload and manage Excel price lists from suppliers. 
                Search across all products and compare pricing instantly.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Microchip className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Hardware Focused</CardTitle>
              <CardDescription>
                Built specifically for computer hardware sales with comprehensive 
                categories, brands, and specifications support.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardContent className="pt-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ready to Transform Your Supplier Management?
              </h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of hardware retailers who trust SupHub to manage their supplier relationships 
                and streamline their procurement processes.
              </p>
              <Button 
                onClick={handleLogin}
                size="lg"
                className="px-8 py-4"
              >
                Get Started Today
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}