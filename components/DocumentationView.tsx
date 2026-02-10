
import React from 'react';

const DocumentationView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12 pb-32">
      <section>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">System Architecture & SaaS Roadmap</h1>
        <p className="text-lg text-slate-600">Documentation for BistroFlow - A production-ready Restaurant Management SaaS.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-indigo-600"><i className="fas fa-database mr-2"></i> Database Schema (SQL)</h2>
          <pre className="text-[10px] font-mono bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto leading-relaxed">
{`CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_veg BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, preparing, ready, completed
  order_type VARCHAR(50), -- dine-in, takeaway, delivery
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
          </pre>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-emerald-600"><i className="fas fa-server mr-2"></i> API Route List (FastAPI)</h2>
          <div className="space-y-3">
             <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded">POST</span>
                <code className="text-xs text-slate-700">/api/v1/auth/login</code>
             </div>
             <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded">GET</span>
                <code className="text-xs text-slate-700">/api/v1/menu/items</code>
             </div>
             <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded">POST</span>
                <code className="text-xs text-slate-700">/api/v1/orders/create</code>
             </div>
             <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded">PATCH</span>
                <code className="text-xs text-slate-700">/api/v1/orders/{'{id}'}/status</code>
             </div>
             <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded">POST</span>
                <code className="text-xs text-slate-700">/api/v1/ai/query</code>
             </div>
          </div>
        </section>
      </div>

      <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">Deployment & Scaling Strategy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                 <i className="fas fa-layer-group text-xl"></i>
              </div>
              <h3 className="font-bold text-slate-800">VPS + Docker</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Deploy using <code>docker-compose</code> on any cloud provider (AWS, DigitalOcean, GCP). 
                FastAPI containers handle logic, while Nginx serves as a reverse proxy with SSL via Certbot.
              </p>
           </div>
           <div className="space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                 <i className="fas fa-shield-alt text-xl"></i>
              </div>
              <h3 className="font-bold text-slate-800">SaaS Multi-tenancy</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Upgrade strategy: Add a <code>tenants</code> table. Every record (Order, Category, MenuItem) will have a <code>tenant_id</code>. 
                Auth middleware will filter data automatically based on the logged-in user's domain/tenant.
              </p>
           </div>
           <div className="space-y-3">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                 <i className="fas fa-expand-arrows-alt text-xl"></i>
              </div>
              <h3 className="font-bold text-slate-800">Scaling AI</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Offload AI queries to Celery workers if processing heavy analytics. 
                Use Redis for caching frequently asked questions to reduce API costs and latency.
              </p>
           </div>
        </div>
      </section>

      <section className="bg-slate-900 text-white p-8 rounded-3xl">
         <h2 className="text-2xl font-bold mb-4">Security Implementation</h2>
         <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-400">
            <li className="flex items-center gap-3"><i className="fas fa-check text-indigo-400"></i> JWT with short-lived tokens</li>
            <li className="flex items-center gap-3"><i className="fas fa-check text-indigo-400"></i> Bcrypt for password hashing</li>
            <li className="flex items-center gap-3"><i className="fas fa-check text-indigo-400"></i> AES-256 for API key encryption</li>
            <li className="flex items-center gap-3"><i className="fas fa-check text-indigo-400"></i> Webhook signature verification</li>
            <li className="flex items-center gap-3"><i className="fas fa-check text-indigo-400"></i> Rate limiting per IP on public API</li>
            <li className="flex items-center gap-3"><i className="fas fa-check text-indigo-400"></i> Pydantic request validation</li>
         </ul>
      </section>
    </div>
  );
};

export default DocumentationView;
