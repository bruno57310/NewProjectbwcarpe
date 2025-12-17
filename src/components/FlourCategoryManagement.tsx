import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronDown, ChevronUp, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FlourData {
  [key: string]: any;
}

function FlourCategoryManagement() {
  const { user } = useAuth();
  const [openSections, setOpenSections] = useState({
    section1: false,
    section2: false,
    section3: false
  });
  
  // Section 1 state
  const [section1Data, setSection1Data] = useState<FlourData[]>([]);
  const [section1Loading, setSection1Loading] = useState(false);
  const [section1Error, setSection1Error] = useState<string | null>(null);
  const [section1ActiveButton, setSection1ActiveButton] = useState(1);
  
  // Section 2 state
  const [section2Data, setSection2Data] = useState<FlourData[]>([]);
  const [section2Loading, setSection2Loading] = useState(false);
  const [section2Error, setSection2Error] = useState<string | null>(null);
  const [section2ActiveButton, setSection2ActiveButton] = useState(1);
  
  // Section 3 state
  const [section3Data, setSection3Data] = useState<FlourData[]>([]);
  const [section3Loading, setSection3Loading] = useState(false);
  const [section3Error, setSection3Error] = useState<string | null>(null);
  const [section3ActiveButton, setSection3ActiveButton] = useState(1);
  const [privateUsers, setPrivateUsers] = useState<{email: string, user_id_private_flours: string}[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  useEffect(() => {
    if (openSections.section1 && section1ActiveButton === 1) {
      executeSection1Function(1);
    }
  }, [openSections.section1]);

  useEffect(() => {
    if (openSections.section2 && section2ActiveButton === 1) {
      executeSection2Function(1);
    }
  }, [openSections.section2]);

  useEffect(() => {
    if (openSections.section3 && section3ActiveButton === 1) {
      executeSection3Function(1);
    }
  }, [openSections.section3]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Section 1 functions
  const executeSection1Function = async (buttonNumber: number) => {
    setSection1Loading(true);
    setSection1Error(null);
    setSection1ActiveButton(buttonNumber);
    
    try {
      let functionName = '';
      switch (buttonNumber) {
        case 1:
          functionName = 'get_communes_public_and_enterprise';
          break;
        case 2:
          functionName = 'get_public_noexistin_enterprise';
          break;
        case 3:
          functionName = 'get_enterprise_noexistin_public';
          break;
      }
      
      const { data, error } = await supabase.rpc(functionName);
      
      if (error) throw error;
      setSection1Data(data || []);
    } catch (err) {
      console.error('Error executing section 1 function:', err);
      setSection1Error(err instanceof Error ? err.message : 'Erreur lors de l\'exécution de la fonction');
    } finally {
      setSection1Loading(false);
    }
  };

  // Section 2 functions
  const executeSection2Function = async (buttonNumber: number) => {
    setSection2Loading(true);
    setSection2Error(null);
    setSection2ActiveButton(buttonNumber);
    
    try {
      let functionName = '';
      switch (buttonNumber) {
        case 1:
          functionName = 'get_communes_private_and_enterprise_fromenterprise';
          break;
        case 2:
          functionName = 'get_communes_private_and_enterprise_fromprivate';
          break;
        case 3:
          functionName = 'get_private_noexistin_enterprise';
          break;
        case 4:
          functionName = 'get_enterprise_noexistin_private';
          break;
      }
      
      const { data, error } = await supabase.rpc(functionName);
      
      if (error) throw error;
      setSection2Data(data || []);
    } catch (err) {
      console.error('Error executing section 2 function:', err);
      setSection2Error(err instanceof Error ? err.message : 'Erreur lors de l\'exécution de la fonction');
    } finally {
      setSection2Loading(false);
    }
  };

  // Section 3 functions
  const executeSection3Function = async (buttonNumber: number) => {
    setSection3Loading(true);
    setSection3Error(null);
    setSection3ActiveButton(buttonNumber);
    
    try {
      if (buttonNumber === 1) {
        const { data, error } = await supabase.rpc('compare_public_enterprise');
        
        if (error) throw error;
        setSection3Data(data || []);
      } else if (buttonNumber === 2) {
        // First get the list of private flour users
        const { data: usersData, error: usersError } = await supabase.rpc('list_private_flour_users');
        
        if (usersError) throw usersError;
        setPrivateUsers(usersData || []);
        
        // If there's a selected user, execute the comparison
        if (selectedUserId) {
          const { data, error } = await supabase.rpc('compare_private_enterprise', {
            user_uuid: selectedUserId
          });
          
          if (error) throw error;
          setSection3Data(data || []);
        } else {
          setSection3Data([]);
        }
      }
    } catch (err) {
      console.error('Error executing section 3 function:', err);
      setSection3Error(err instanceof Error ? err.message : 'Erreur lors de l\'exécution de la fonction');
    } finally {
      setSection3Loading(false);
    }
  };

  const handleUserSelection = async (userId: string) => {
    setSelectedUserId(userId);
    
    if (userId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        setSection3Error('Format UUID invalide pour l\'utilisateur sélectionné');
        return;
      }
      
      setSection3Loading(true);
      try {
        const { data, error } = await supabase.rpc('compare_private_enterprise', {
          user_uuid: userId
        });
        
        if (error) throw error;
        setSection3Data(data || []);
      } catch (err) {
        console.error('Error executing comparison:', err);
        setSection3Error(err instanceof Error ? err.message : 'Erreur lors de l\'exécution de la comparaison');
      } finally {
        setSection3Loading(false);
      }
    }
  };

  const renderDataTable = (data: FlourData[], loading: boolean, error: string | null) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          Aucune donnée trouvée
        </div>
      );
    }

    const columns = Object.keys(data[0]);

    return (
      <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map(column => (
                <th key={column} className="px-4 py-2 border-b border-gray-200">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map(column => (
                  <td key={column} className="px-4 py-2">
                    {typeof row[column] === 'object' && row[column] !== null
                      ? JSON.stringify(row[column])
                      : String(row[column] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
          <p className="mb-4">Cette page est réservée à l'administrateur.</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/dashboard"
          className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
          title="Retour au tableau de bord"
        >
          <Home className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-green-800">
          Gestion des Farines et Catégories
        </h1>
      </div>

      <div className="space-y-6">
        {/* Section 1: Relation Farines Catalogue Public et Enterprise */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Database className="w-6 h-6 text-blue-700" />
              </div>
              <h2 className="text-xl font-semibold text-blue-800">
                Relation Farines Catalogue Public et Enterprise
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('section1')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.section1 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          {openSections.section1 && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => executeSection1Function(1)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    section1ActiveButton === 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Commun Public et Enterprise
                </button>
                <button
                  onClick={() => executeSection1Function(2)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    section1ActiveButton === 2 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Public Noexistin Enterprise
                </button>
                <button
                  onClick={() => executeSection1Function(3)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    section1ActiveButton === 3 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Enterprise Noexistin Public
                </button>
              </div>
              
              {renderDataTable(section1Data, section1Loading, section1Error)}
            </div>
          )}
        </div>

        {/* Section 2: Relation Farines Catalogue Enterprise et Privé */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Database className="w-6 h-6 text-purple-700" />
              </div>
              <h2 className="text-xl font-semibold text-purple-800">
                Relation Farines Catalogue Enterprise et Privé
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('section2')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.section2 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          {openSections.section2 && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => executeSection2Function(1)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    section2ActiveButton === 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Commun Private et Enterprise from Enter
                </button>
                <button
                  onClick={() => executeSection2Function(2)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    section2ActiveButton === 2 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Commun Private et Enterprise from Priv
                </button>
                <button
                  onClick={() => executeSection2Function(3)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    section2ActiveButton === 3 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Private Noexistin Enterprise
                </button>
                <button
                  onClick={() => executeSection2Function(4)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    section2ActiveButton === 4 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Enterprise Noexistin Private
                </button>
              </div>
              
              {renderDataTable(section2Data, section2Loading, section2Error)}
            </div>
          )}
        </div>

        {/* Section 3: Comparaison Farines Catalogue Public, Enterprise et Privé */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Database className="w-6 h-6 text-green-700" />
              </div>
              <h2 className="text-xl font-semibold text-green-800">
                Comparaison Farines Catalogue Public, Enterprise et Privé
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('section3')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.section3 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          {openSections.section3 && (
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => executeSection3Function(1)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    section3ActiveButton === 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Comparaison Public et Enterprise
                </button>
                <button
                  onClick={() => executeSection3Function(2)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    section3ActiveButton === 2 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Comparaison Enterprise et Private
                </button>
                
                {section3ActiveButton === 2 && (
                  <select
                    value={selectedUserId}
                    onChange={(e) => handleUserSelection(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {privateUsers.map(user => (
                      <option key={user.user_id_private_flours} value={user.user_id_private_flours}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {renderDataTable(section3Data, section3Loading, section3Error)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlourCategoryManagement;
