import React from 'react';
import { LogOut, Menu, User } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const StyleGuide = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-primary flex items-center px-4 md:px-6 z-50">
        <div className="grid grid-cols-3 w-full items-center">
          <div className="justify-self-start">
            <button
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="justify-self-center">
            <h1 className="text-white text-xl font-semibold">Design System</h1>
          </div>

          <div className="justify-self-end">
            <button 
              className="flex items-center justify-center w-10 h-10 text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Profile menu"
            >
              <User size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Colors */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Colors</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <ColorSwatch name="Primary" className="bg-primary text-white" />
              <ColorSwatch name="Secondary" className="bg-secondary text-white" />
              <ColorSwatch name="Success" className="bg-success text-white" />
              <ColorSwatch name="Error" className="bg-error text-white" />
              <ColorSwatch name="Warning" className="bg-warning text-black" />
              <ColorSwatch name="Info" className="bg-info text-white" />
            </div>
          </section>

          {/* Typography */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Typography</h2>
            <Card>
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold">Heading 1</h1>
                  <code className="text-sm text-gray-500">text-4xl font-bold</code>
                </div>
                <div>
                  <h2 className="text-3xl font-semibold">Heading 2</h2>
                  <code className="text-sm text-gray-500">text-3xl font-semibold</code>
                </div>
                <div>
                  <h3 className="text-2xl font-medium">Heading 3</h3>
                  <code className="text-sm text-gray-500">text-2xl font-medium</code>
                </div>
                <div>
                  <p className="text-base">Body text</p>
                  <code className="text-sm text-gray-500">text-base</code>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Small text / Caption</p>
                  <code className="text-sm text-gray-500">text-sm text-gray-500</code>
                </div>
              </div>
            </Card>
          </section>

          {/* Buttons */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Buttons</h2>
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium mb-2">Default Variants</h3>
                  <div className="space-y-2">
                    <Button>Default Button</Button>
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="link">Link Button</Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium mb-2">Sizes</h3>
                  <div className="space-y-2">
                    <Button size="small">Small Button</Button>
                    <Button>Default Size</Button>
                    <Button size="large">Large Button</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium mb-2">States</h3>
                  <div className="space-y-2">
                    <Button>Normal</Button>
                    <Button disabled>Disabled</Button>
                    <Button startIcon={<User size={16} />}>With Start Icon</Button>
                    <Button endIcon={<LogOut size={16} />}>With End Icon</Button>
                    <Button fullWidth>Full Width Button</Button>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Cards */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card title="Basic Card">
                <p>This is a basic card with a title and some content.</p>
              </Card>

              <Card 
                title="Card with Action" 
                action={<Button variant="outline" size="small">Action</Button>}
              >
                <p>This card has a title, content, and an action button.</p>
              </Card>

              <Card 
                title="Card with Subtitle" 
                subtitle="Additional information"
              >
                <p>This card includes a subtitle below the main title.</p>
              </Card>
            </div>
          </section>

          {/* Status Indicators */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Status Indicators</h2>
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Badges</h3>
                  <div className="space-y-2">
                    <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                      Success
                    </div>
                    <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
                      Error
                    </div>
                    <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                      Warning
                    </div>
                    <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
                      Info
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Status Text</h3>
                  <div className="space-y-2">
                    <p className="text-success">Success Message</p>
                    <p className="text-error">Error Message</p>
                    <p className="text-warning">Warning Message</p>
                    <p className="text-info">Info Message</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
};

const ColorSwatch = ({ name, className }) => (
  <div className={`p-6 rounded-lg ${className}`}>
    <span className="font-medium">{name}</span>
  </div>
);

export default StyleGuide;