import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiRequest } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface Plan {
  id: string;
  name: string;
  nameHi: string;
  durationDays: number;
  priceInr: number;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { refreshProfile } = useAuth();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'nb'>('upi');
  const [verifying, setVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const currentLang = i18n.language || 'en';

  const fetchPlans = async () => {
    try {
      const res = await apiRequest('/payments/plans');
      if (res.success && res.data) {
        setPlans(res.data);
        if (res.data.length > 0) {
          setSelectedPlanId(res.data[0].id);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleProceedToPay = async () => {
    if (!selectedPlanId) return;
    setPurchasing(true);
    try {
      const res = await apiRequest('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ planId: selectedPlanId }),
      });
      if (res.success && res.data) {
        setCurrentOrder(res.data);
        setPaymentModalVisible(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to initialize payment');
    } finally {
      setPurchasing(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!currentOrder) return;
    setVerifying(true);
    
    // Simulate network delay for payment gateway processing
    setTimeout(async () => {
      try {
        const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
        const res = await apiRequest('/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpayOrderId: currentOrder.orderId,
            razorpayPaymentId: mockPaymentId,
            razorpaySignature: 'mock_signature',
          }),
        });

        if (res.success) {
          // Sync new user tier (Premium)
          await refreshProfile();
          setPaymentSuccess(true);
          setPaymentModalVisible(false);
        } else {
          Alert.alert('Payment Failed', 'Verification failed');
        }
      } catch (err: any) {
        Alert.alert('Payment Error', err.message || 'Verification failed');
      } finally {
        setVerifying(false);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B5620E" />
      </View>
    );
  }

  if (paymentSuccess) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#B5620E" style={{ marginBottom: 20 }} />
        <Text style={styles.successTitle}>
          {currentLang === 'hi' ? 'भुगतान सफल! 🎉' : 'Payment Successful! 🎉'}
        </Text>
        <Text style={styles.successSub}>
          {currentLang === 'hi'
            ? 'आपका खाता अब प्रीमियम में अपग्रेड हो गया है।'
            : 'Your account has been upgraded to Premium.'}
        </Text>
        <Text style={styles.successDescription}>
          {currentLang === 'hi'
            ? 'अब आप सभी संपर्कों का पूरा विवरण, तस्वीरें और कुण्डली मिलान देख सकते हैं।'
            : 'You can now view unmasked contacts, full family details, photos and astrological compatibility.'}
        </Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => {
            router.replace('/(tabs)');
          }}
        >
          <Text style={styles.doneBtnText}>
            {currentLang === 'hi' ? 'शुरू करें / Let\'s Go' : 'Get Started'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#B5620E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentLang === 'hi' ? 'प्रीमियम अपग्रेड / Upgrade' : 'Upgrade Premium'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Promotion header */}
        <View style={styles.promoHeader}>
          <Ionicons name="sparkles" size={36} color="#B5620E" style={{ marginBottom: 12 }} />
          <Text style={styles.promoTitle}>
            {currentLang === 'hi' ? 'सार्थी प्रीमियम सदस्यता' : 'Sarthi Premium Benefits'}
          </Text>
          <Text style={styles.promoSubtitle}>
            {currentLang === 'hi' 
              ? 'गहोई समाज में सही जीवनसाथी खोजने का आसान माध्यम'
              : 'Find your perfect life partner in the Gahoi community'}
          </Text>
        </View>

        {/* Benefits list */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#B5620E" />
            <Text style={styles.benefitText}>
              {currentLang === 'hi' ? 'अनमास्क्ड मोबाइल और ईमेल देखें' : 'View unmasked phone numbers & emails'}
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#B5620E" />
            <Text style={styles.benefitText}>
              {currentLang === 'hi' ? 'घर के पते और माता-पिता के नाम देखें' : 'View home addresses & parent names'}
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#B5620E" />
            <Text style={styles.benefitText}>
              {currentLang === 'hi' ? 'अष्टकूट कुण्डली मिलान स्कोर (36 गुण)' : 'Full Ashtakoot Kundli Gun matching'}
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#B5620E" />
            <Text style={styles.benefitText}>
              {currentLang === 'hi' ? 'असीमित रुचि अनुरोध भेजें' : 'Send unlimited interest requests'}
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#B5620E" />
            <Text style={styles.benefitText}>
              {currentLang === 'hi' ? 'सभी स्वीकृत गैलरी फ़ोटो देखें' : 'View all approved gallery photos'}
            </Text>
          </View>
        </View>

        {/* Plans Selector */}
        <Text style={styles.sectionTitle}>
          {currentLang === 'hi' ? 'प्लान चुनें / Select Plan' : 'Choose a Plan'}
        </Text>
        
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, isSelected && styles.planCardSelected]}
              onPress={() => setSelectedPlanId(plan.id)}
            >
              <View style={styles.planCardLeft}>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={isSelected ? '#B5620E' : '#8A7A60'}
                />
                <View style={styles.planMeta}>
                  <Text style={styles.planName}>
                    {currentLang === 'hi' ? plan.nameHi : plan.name}
                  </Text>
                  <Text style={styles.planDuration}>
                    {plan.durationDays} {currentLang === 'hi' ? 'दिन वैध' : 'days validity'}
                  </Text>
                </View>
              </View>
              <Text style={styles.planPrice}>₹{plan.priceInr}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer Payment Action */}
      {selectedPlan && (
        <View style={styles.footer}>
          <View style={styles.footerPriceRow}>
            <Text style={styles.footerPriceLabel}>Total Amount:</Text>
            <Text style={styles.footerPriceText}>₹{selectedPlan.priceInr}</Text>
          </View>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handleProceedToPay}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="#FFFFFF" />
                <Text style={styles.payButtonText}>
                  {currentLang === 'hi' ? 'भुगतान करें' : 'Proceed to Pay'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Simulated Razorpay Checkout Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="card" size={24} color="#B5620E" />
                <Text style={styles.modalTitle}>Razorpay Sandbox</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPaymentModalVisible(false)}
                disabled={verifying}
              >
                <Ionicons name="close" size={24} color="#8A7A60" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.orderLabel}>Paying to Sarthi Matrimony</Text>
              <Text style={styles.orderAmount}>₹{currentOrder?.amount}</Text>
              <Text style={styles.orderPlan}>
                Plan: {currentLang === 'hi' ? currentOrder?.planNameHi : currentOrder?.planName}
              </Text>

              {/* Payment options */}
              <Text style={styles.paymentMethodTitle}>Select Payment Method:</Text>

              <TouchableOpacity
                style={[styles.methodRow, paymentMethod === 'upi' && styles.methodRowSelected]}
                onPress={() => setPaymentMethod('upi')}
                disabled={verifying}
              >
                <Ionicons name="logo-google" size={18} color="#8A7A60" />
                <Text style={styles.methodText}>Google Pay / UPI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodRow, paymentMethod === 'card' && styles.methodRowSelected]}
                onPress={() => setPaymentMethod('card')}
                disabled={verifying}
              >
                <Ionicons name="card-outline" size={18} color="#8A7A60" />
                <Text style={styles.methodText}>Credit / Debit Card</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodRow, paymentMethod === 'nb' && styles.methodRowSelected]}
                onPress={() => setPaymentMethod('nb')}
                disabled={verifying}
              >
                <Ionicons name="business-outline" size={18} color="#8A7A60" />
                <Text style={styles.methodText}>Net Banking</Text>
              </TouchableOpacity>

              {/* Pay trigger */}
              <TouchableOpacity
                style={styles.modalPayButton}
                onPress={handleSimulatePayment}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPayBtnText}>Simulate Success Pay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAF5',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FDFAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#FDFAF5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successTitle: {
    color: '#B5620E',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'center',
  },
  successSub: {
    color: '#3D2E1A',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  successDescription: {
    color: '#8A7A60',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  doneBtn: {
    backgroundColor: '#B5620E',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDFAF5',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#B5620E',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  promoHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  promoTitle: {
    color: '#3D2E1A',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  promoSubtitle: {
    color: '#3D2E1A',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  benefitsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    padding: 16,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  benefitText: {
    color: '#3D2E1A',
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
  },
  sectionTitle: {
    color: '#B5620E',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    padding: 16,
    marginBottom: 12,
  },
  planCardSelected: {
    borderColor: '#B5620E',
    backgroundColor: '#FDF3E0',
  },
  planCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planMeta: {
    marginLeft: 12,
  },
  planName: {
    color: '#3D2E1A',
    fontSize: 15,
    fontWeight: '700',
  },
  planDuration: {
    color: '#8A7A60',
    fontSize: 12,
    marginTop: 2,
  },
  planPrice: {
    color: '#B5620E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerPriceRow: {
    justifyContent: 'center',
  },
  footerPriceLabel: {
    color: '#8A7A60',
    fontSize: 12,
  },
  footerPriceText: {
    color: '#3D2E1A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  payButton: {
    backgroundColor: '#B5620E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    color: '#B5620E',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalBody: {
    alignItems: 'center',
  },
  orderLabel: {
    color: '#8A7A60',
    fontSize: 13,
  },
  orderAmount: {
    color: '#3D2E1A',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  orderPlan: {
    color: '#3D2E1A',
    fontSize: 14,
    marginBottom: 20,
  },
  paymentMethodTitle: {
    color: '#3D2E1A',
    fontSize: 13,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFAF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    padding: 12,
    width: '100%',
    marginBottom: 10,
  },
  methodRowSelected: {
    borderColor: '#B5620E',
    backgroundColor: '#351C0E',
  },
  methodText: {
    color: '#3D2E1A',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalPayButton: {
    backgroundColor: '#B5620E',
    borderRadius: 8,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  modalPayBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
