import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  Users, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Eye,
  X,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PayPalSubscription {
  id: string;
  user_email: string;
  plan_id: string;
  status: 'ACTIVE' | 'CANCELLED' | 'SUSPENDED' | 'EXPIRED';
  start_time: string;
  billing_info: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
    cycle_executions: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme_version: number;
    }>;
    last_payment: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    next_billing_time: string;
    final_payment_time: string;
    failed_payments_count: number;
  };
  subscriber: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
    payer_id: string;
  };
  auto_renewal: boolean;
  plan_overridden: boolean;
  create_time: string;
  update_time: string;
}

interface PayPalPlan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CREATED';
  billing_cycles: Array<{
    frequency: {
      interval_unit: string;
      interval_count: number;
    };
    tenure_type: string;
    sequence: number;
    total_cycles: number;
    pricing_scheme: {
      fixed_price: {
        currency_code: string;
        value: string;
      };
    };
  }>;
  payment_preferences: {
    auto_bill_outstanding: boolean;
    setup_fee: {
      currency_code: string;
      value: string;
    };
    setup_fee_failure_action: string;
    payment_failure_threshold: number;
  };
  taxes: {
    percentage: string;
    inclusive: boolean;
  };
  create_time: string;
  update_time: string;
}

function PayPalManagement() {
  const [subscriptions, setSubscriptions] = useState<PayPalSubscription[]>([]);
  const [plans, setPlans] = useState<PayPalPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<PayPalSubscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  useEffect(() => {
    if (isAdmin) {
      fetchPayPalData();
    }
  }, [isAdmin]);

  const fetchPayPalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simuler l'appel à l'API PayPal pour récupérer les abonnements
      // En production, ceci devrait être un appel à votre backend qui interroge l'API PayPal
      const mockSubscriptions: PayPalSubscription[] = [
        {
          id: 'I-BW452GLLEP1G',
          user_email: 'nobody57@orange.fr',
          plan_id: 'P-5ML4271244454362WXNWU5NQ',
          status: 'ACTIVE',
          start_time: '2024-01-15T10:00:00Z',
          billing_info: {
            outstanding_balance: {
              currency_code: 'EUR',
              value: '0.00'
            },
            cycle_executions: [{
              tenure_type: 'REGULAR',
              sequence: 1,
              cycles_completed: 2,
              cycles_remaining: 0,
              current_pricing_scheme_version: 1
            }],
            last_payment: {
              amount: {
                currency_code: 'EUR',
                value: '30.00'
              },
              time: '2024-03-15T10:00:00Z'
            },
            next_billing_time: '2024-06-15T10:00:00Z',
            final_payment_time: '',
            failed_payments_count: 0
          },
          subscriber: {
            name: {
              given_name: 'John',
              surname: 'Doe'
            },
            email_address: 'nobody57@orange.fr',
            payer_id: 'PAYER123456789'
          },
          auto_renewal: true,
          plan_overridden: false,
          create_time: '2024-01-15T10:00:00Z',
          update_time: '2024-03-15T10:00:00Z'
        }
      ];

      const mockPlans: PayPalPlan[] = [
        {
          id: 'P-5ML4271244454362WXNWU5NQ',
          product_id: 'PROD-CARPBAIT-PRO3',
          name: 'CarpBait Pro3',
          description: 'Abonnement trimestriel CarpBait Pro3',
          status: 'ACTIVE',
          billing_cycles: [{
            frequency: {
              interval_unit: 'MONTH',
              interval_count: 3
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                currency_code: 'EUR',
                value: '30.00'
              }
            }
          }],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: {
              currency_code: 'EUR',
              value: '0.00'
            },
            setup_fee_failure_action: 'CONTINUE',
            payment_failure_threshold: 0
          },
          taxes: {
            percentage: '20.0',
            inclusive: false
          },
          create_time: '2024-01-01T00:00:00Z',
          update_time: '2024-01-01T00:00:00Z'
        }
      ];

      setSubscriptions(mockSubscriptions);
      setPlans(mockPlans);
    } catch (err) {
      console.error('Error fetching PayPal data:', err);
      setError('Erreur lors de la récupération des données PayPal');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPayPalData();
    setRefreshing(false);
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?')) return;

    try {
      setError(null);
      setSuccess(null);

      // Ici, vous devriez appeler votre API backend qui annule l'abonnement PayPal
      console.log('Cancelling subscription:', subscriptionId);
      
      // Simuler l'annulation
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, status: 'CANCELLED' as const }
            : sub
        )
      );

      setSuccess('Abonnement annulé avec succès');
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Erreur lors de l\'annulation de l\'abonnement');
    }
  };

  const exportSubscriptionsCSV = () => {
    if (subscriptions.length === 0) return;
    
    const headers = [
      'Subscription ID',
      'User Email',
      'Plan ID',
      'Status',
      'Start Time',
      'Next Billing',
      'Last Payment Amount',
      'Last Payment Date',
      'Failed Payments',
      'Auto Renewal'
    ].join(',');
    
    const rows = subscriptions.map(sub => [
      sub.id,
      `"${sub.user_email}"`,
      sub.plan_id,
      sub.status,
      sub.start_time,
      sub.billing_info.next_billing_time || '',
      sub.billing_info.last_payment?.amount?.value || '0',
      sub.billing_info.last_payment?.time || '',
      sub.billing_info.failed_payments_count || 0,
      sub.auto_renewal
    ].join(','));
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `paypal_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.subscriber.name.given_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.subscriber.name.surname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Actif
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Annulé
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Suspendu
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Expiré
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
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
          Gestion PayPal
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Users className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Abonnements</p>
              <p className="text-2xl font-bold text-green-800">{subscriptions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Abonnements Actifs</p>
              <p className="text-2xl font-bold text-blue-800">
                {subscriptions.filter(sub => sub.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <X className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Abonnements Annulés</p>
              <p className="text-2xl font-bold text-red-800">
                {subscriptions.filter(sub => sub.status === 'CANCELLED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenus Mensuels</p>
              <p className="text-2xl font-bold text-yellow-800">
                {subscriptions
                  .filter(sub => sub.status === 'ACTIVE')
                  .reduce((total, sub) => {
                    const amount = parseFloat(sub.billing_info.last_payment?.amount?.value || '0');
                    return total + amount;
                  }, 0)
                  .toFixed(2)}€
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Management */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-green-800">
            Plans PayPal Configurés
          </h2>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Plan ID</th>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Prix</th>
                <th className="px-4 py-2">Fréquence</th>
                <th className="px-4 py-2">Taxe</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{plan.id}</td>
                  <td className="px-4 py-2 font-medium">{plan.name}</td>
                  <td className="px-4 py-2">
                    {plan.billing_cycles[0]?.pricing_scheme?.fixed_price?.value}€
                  </td>
                  <td className="px-4 py-2">
                    Tous les {plan.billing_cycles[0]?.frequency?.interval_count} {
                      plan.billing_cycles[0]?.frequency?.interval_unit === 'MONTH' ? 'mois' : 'jours'
                    }
                  </td>
                  <td className="px-4 py-2">{plan.taxes?.percentage}%</td>
                  <td className="px-4 py-2">
                    {plan.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {plan.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(plan.create_time).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscriptions Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-green-800">
            Abonnements Utilisateurs
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={exportSubscriptionsCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
              disabled={subscriptions.length === 0}
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par email ou nom..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="CANCELLED">Annulé</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="EXPIRED">Expiré</option>
            </select>
            <button 
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtrer
            </button>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Utilisateur</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Prochaine facturation</th>
                <th className="px-4 py-2">Dernier paiement</th>
                <th className="px-4 py-2">Échecs</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div>
                      <p className="font-medium">{subscription.user_email}</p>
                      <p className="text-xs text-gray-500">
                        {subscription.subscriber.name.given_name} {subscription.subscriber.name.surname}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div>
                      <p className="font-medium">
                        {plans.find(p => p.id === subscription.plan_id)?.name || 'Plan inconnu'}
                      </p>
                      <p className="text-xs text-gray-500">{subscription.plan_id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    {getStatusBadge(subscription.status)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {subscription.billing_info.next_billing_time 
                          ? new Date(subscription.billing_info.next_billing_time).toLocaleDateString()
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div>
                      <p className="font-medium">
                        {subscription.billing_info.last_payment?.amount?.value || '0'}€
                      </p>
                      <p className="text-xs text-gray-500">
                        {subscription.billing_info.last_payment?.time 
                          ? new Date(subscription.billing_info.last_payment.time).toLocaleDateString()
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`font-medium ${
                      subscription.billing_info.failed_payments_count > 0 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {subscription.billing_info.failed_payments_count}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSubscription(subscription)}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {subscription.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCancelSubscription(subscription.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Annuler l'abonnement"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter ? 'Aucun résultat trouvé' : 'Aucun abonnement PayPal trouvé'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Details Modal */}
      {selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-green-800">
                  Détails de l'abonnement PayPal
                </h3>
                <button
                  onClick={() => setSelectedSubscription(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subscription Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Informations de l'abonnement</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">ID Abonnement</p>
                      <p className="font-mono text-sm">{selectedSubscription.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Plan ID</p>
                      <p className="font-mono text-sm">{selectedSubscription.plan_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <div className="mt-1">
                        {getStatusBadge(selectedSubscription.status)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Renouvellement automatique</p>
                      <p className="font-medium">
                        {selectedSubscription.auto_renewal ? 'Activé' : 'Désactivé'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Créé le</p>
                      <p className="font-medium">
                        {new Date(selectedSubscription.create_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subscriber Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Informations de l'abonné</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedSubscription.subscriber.email_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nom</p>
                      <p className="font-medium">
                        {selectedSubscription.subscriber.name.given_name} {selectedSubscription.subscriber.name.surname}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payer ID</p>
                      <p className="font-mono text-sm">{selectedSubscription.subscriber.payer_id}</p>
                    </div>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="space-y-4 md:col-span-2">
                  <h4 className="font-semibold text-gray-800">Informations de facturation</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Prochaine facturation</p>
                        <p className="font-medium">
                          {selectedSubscription.billing_info.next_billing_time 
                            ? new Date(selectedSubscription.billing_info.next_billing_time).toLocaleString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Dernier paiement</p>
                        <p className="font-medium">
                          {selectedSubscription.billing_info.last_payment?.amount?.value || '0'}€
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedSubscription.billing_info.last_payment?.time 
                            ? new Date(selectedSubscription.billing_info.last_payment.time).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Paiements échoués</p>
                        <p className={`font-medium ${
                          selectedSubscription.billing_info.failed_payments_count > 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {selectedSubscription.billing_info.failed_payments_count}
                        </p>
                      </div>
                    </div>
                    
                    {selectedSubscription.billing_info.cycle_executions.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Cycles de facturation</p>
                        {selectedSubscription.billing_info.cycle_executions.map((cycle, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <p className="text-sm">
                              <span className="font-medium">Cycles complétés:</span> {cycle.cycles_completed}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Cycles restants:</span> {cycle.cycles_remaining === 0 ? 'Illimité' : cycle.cycles_remaining}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSubscription(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayPalManagement;
