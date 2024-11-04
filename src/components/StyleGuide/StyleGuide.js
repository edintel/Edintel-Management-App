import React from 'react';
import Layout from '../../modules/expenseAudit/components/layout/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import './StyleGuide.css';

const StyleGuide = () => {
  return (
    <Layout>
      <div className="styleguide-container">
        <h1 className="styleguide-title">Design System</h1>
        
        <section className="styleguide-section">
          <h2>Colors</h2>
          <div className="color-grid">
            <ColorSwatch name="Primary" className="bg-primary text-white" />
            <ColorSwatch name="Secondary" className="bg-secondary text-white" />
            <ColorSwatch name="Success" className="bg-success text-white" />
            <ColorSwatch name="Error" className="bg-error text-white" />
            <ColorSwatch name="Warning" className="bg-warning text-black" />
            <ColorSwatch name="Info" className="bg-info text-white" />
          </div>
        </section>

        <section className="styleguide-section">
          <h2>Typography</h2>
          <div className="typography-examples">
            <div className="type-example">
              <h1>Heading 1</h1>
              <code>text-4xl font-bold</code>
            </div>
            <div className="type-example">
              <h2>Heading 2</h2>
              <code>text-3xl font-semibold</code>
            </div>
            <div className="type-example">
              <h3>Heading 3</h3>
              <code>text-2xl font-medium</code>
            </div>
            <div className="type-example">
              <p>Body text</p>
              <code>text-base</code>
            </div>
          </div>
        </section>

        <section className="styleguide-section">
          <h2>Buttons</h2>
          <div className="button-grid">
            <div>
              <Button>Default</Button>
            </div>
            <div>
              <Button variant="primary">Primary</Button>
            </div>
            <div>
              <Button variant="secondary">Secondary</Button>
            </div>
            <div>
              <Button variant="outline">Outline</Button>
            </div>
          </div>
        </section>

        <section className="styleguide-section">
          <h2>Cards</h2>
          <div className="card-grid">
            <Card title="Basic Card">
              <p>This is a basic card with some content.</p>
            </Card>
            <Card title="Card with Action" action={<Button>Action</Button>}>
              <p>This card has an action button in its header.</p>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
};

const ColorSwatch = ({ name, className }) => (
  <div className={`color-swatch ${className}`}>
    <span className="color-name">{name}</span>
  </div>
);

export default StyleGuide;