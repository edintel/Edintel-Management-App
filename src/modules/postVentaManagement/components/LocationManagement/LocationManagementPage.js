import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/common/Tabs';
import Card from '../../../../components/common/Card';
import CompanyHierarchy from './CompanyHierarchy';
import SystemManagement from './SystemManagement';
import { usePostVentaManagement } from '../../context/postVentaManagementContext';
import { Loader2, AlertCircle } from 'lucide-react';

const LocationManagementPage = () => {
  const { loading, error } = usePostVentaManagement();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <div className="flex items-center gap-2 justify-center p-6 text-error">
            <AlertCircle className="h-5 w-5" />
            <p>Error: {error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Ubicaciones
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Administre empresas, edificios, sitios y sistemas
        </p>
      </div>

      <Card>
        <Tabs defaultValue="locations" className="w-full">
          <TabsList className="border-b">
            <TabsTrigger value="locations">
              Jerarquía de Ubicaciones
            </TabsTrigger>
            <TabsTrigger value="systems">
              Gestión de Sistemas
            </TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="locations">
              <CompanyHierarchy />
            </TabsContent>

            <TabsContent value="systems">
              <SystemManagement />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default LocationManagementPage;