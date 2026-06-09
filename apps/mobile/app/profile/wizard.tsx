import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth';
import { apiRequest } from '../../src/lib/api';

export default function ProfileWizardScreen() {
  const { refreshProfile } = useAuth();
  
  // Wizard flow state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lists loaded from backend
  const [gotrasList, setGotrasList] = useState<{ id: number; name: string }[]>([]);
  const [citiesList, setCitiesList] = useState<{ id: number; name: string; state: { name: string } }[]>([]);

  // Step 1: Basic Details Form State
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [gotra, setGotra] = useState('');
  const [aakna, setAakna] = useState('');
  const [manglikStatus, setManglikStatus] = useState<'Manglik' | 'Non-Manglik' | 'Anshik Manglik'>('Non-Manglik');
  const [maritalStatus, setMaritalStatus] = useState<'Never Married' | 'Widowed' | 'Divorced' | 'Awaiting Divorce'>('Never Married');
  const [dobYear, setDobYear] = useState('2000');
  const [dobMonth, setDobMonth] = useState('01');
  const [dobDay, setDobDay] = useState('01');
  const [timeOfBirth, setTimeOfBirth] = useState(''); // HH:MM format
  const [heightCm, setHeightCm] = useState('170');
  const [complexion, setComplexion] = useState<'Very Fair' | 'Fair' | 'Wheatish' | 'Wheatish Brown' | 'Dark'>('Wheatish');
  const [mobile, setMobile] = useState('');
  const [livingCityId, setLivingCityId] = useState<number | null>(null);
  const [nativeState, setNativeState] = useState('');
  const [aboutMe, setAboutMe] = useState('');

  // Step 2: Education Form State
  const [highestDegree, setHighestDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [completionYear, setCompletionYear] = useState('2022');

  // Step 3: Occupation Form State
  const [occupationType, setOccupationType] = useState<'Private Job' | 'Government Job' | 'Business' | 'Self-Employed' | 'Not Working'>('Private Job');
  const [jobTitle, setJobTitle] = useState('');
  const [employer, setEmployer] = useState('');
  const [annualIncomeMin, setAnnualIncomeMin] = useState('500000');
  const [annualIncomeMax, setAnnualIncomeMax] = useState('1000000');

  // Step 4: Family Form State
  const [fatherName, setFatherName] = useState('');
  const [fatherMobile, setFatherMobile] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [siblings, setSiblings] = useState('0');
  const [familyType, setFamilyType] = useState<'Joint' | 'Nuclear' | 'Extended'>('Nuclear');
  const [familyStatus, setFamilyStatus] = useState<'Middle Class' | 'Upper Middle Class' | 'Rich' | 'Affluent'>('Middle Class');
  const [homeAddress, setHomeAddress] = useState('');

  // Step 5: Partner Preferences Form State
  const [prefAgeMin, setPrefAgeMin] = useState('18');
  const [prefAgeMax, setPrefAgeMax] = useState('35');
  const [prefHeightMin, setPrefHeightMin] = useState('150');
  const [prefHeightMax, setPrefHeightMax] = useState('200');
  const [prefMaritalStatus, setPrefMaritalStatus] = useState<string[]>(['Never Married']);
  const [prefEducationMin, setPrefEducationMin] = useState('');
  const [prefIncomeMin, setPrefIncomeMin] = useState('300000');
  const [prefManglik, setPrefManglik] = useState<'Manglik' | 'Non-Manglik' | 'Any'>('Any');
  const [excludeSameGotra, setExcludeSameGotra] = useState(true);

  // Load gotras and cities on mount
  useEffect(() => {
    async function loadMetadata() {
      setLoading(true);
      try {
        const gotrasRes = await apiRequest('/profile/metadata/gotras');
        if (gotrasRes.success && gotrasRes.data) {
          setGotrasList(gotrasRes.data);
        }
        const citiesRes = await apiRequest('/profile/metadata/cities');
        if (citiesRes.success && citiesRes.data) {
          setCitiesList(citiesRes.data);
          if (citiesRes.data.length > 0) {
            setLivingCityId(citiesRes.data[0].id);
          }
        }
      } catch (err: any) {
        setError('Failed to load list details / विवरण लोड करने में असमर्थ');
      } finally {
        setLoading(false);
      }
    }
    loadMetadata();
  }, []);

  const handleSaveStep1 = async () => {
    // Validate
    if (!mobile || mobile.length < 10) {
      setError('Mobile is required / मोबाइल नंबर आवश्यक है');
      return;
    }
    if (!livingCityId) {
      setError('City selection is required / शहर का चयन आवश्यक है');
      return;
    }

    setSubmitting(true);
    setError(null);

    const dobString = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}T00:00:00.000Z`;

    try {
      const res = await apiRequest('/profile/me', {
        method: 'PATCH',
        body: JSON.stringify({
          gender,
          gotra: gotra || 'Kashyap', // default
          aakna,
          manglikStatus,
          maritalStatus,
          dateOfBirth: dobString,
          timeOfBirth: timeOfBirth || '12:00',
          height_cm: Number(heightCm),
          complexion,
          mobile,
          livingCityId: Number(livingCityId),
          nativeState: nativeState || 'Madhya Pradesh',
          aboutMe,
          countryId: 1, // India
        }),
      });

      if (res.success) {
        setStep(2);
      } else {
        setError(res.error || 'Failed to save basic details');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStep2 = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiRequest('/profile/me/education', {
        method: 'PATCH',
        body: JSON.stringify({
          highestDegree: highestDegree || 'B.Tech',
          fieldOfStudy: fieldOfStudy || 'Computer Science',
          institution: institution || 'IIT',
          completionYear: Number(completionYear),
        }),
      });

      if (res.success) {
        setStep(3);
      } else {
        setError(res.error || 'Failed to save education details');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStep3 = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiRequest('/profile/me/occupation', {
        method: 'PATCH',
        body: JSON.stringify({
          occupationType,
          jobTitle: jobTitle || 'Engineer',
          employer: employer || 'Google',
          annualIncomeMin: Number(annualIncomeMin),
          annualIncomeMax: Number(annualIncomeMax),
        }),
      });

      if (res.success) {
        setStep(4);
      } else {
        setError(res.error || 'Failed to save occupation details');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStep4 = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiRequest('/profile/me/family', {
        method: 'PATCH',
        body: JSON.stringify({
          fatherName: fatherName || 'Father Name',
          fatherMobile: fatherMobile || '9876543210',
          fatherOccupation: fatherOccupation || 'Business',
          motherName: motherName || 'Mother Name',
          motherOccupation: motherOccupation || 'Housewife',
          siblings: Number(siblings),
          familyType,
          familyStatus,
          homeAddress: homeAddress || 'Home Address',
        }),
      });

      if (res.success) {
        setStep(5);
      } else {
        setError(res.error || 'Failed to save family details');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStep5 = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiRequest('/profile/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          ageMin: Number(prefAgeMin),
          ageMax: Number(prefAgeMax),
          heightMinCm: Number(prefHeightMin),
          heightMaxCm: Number(prefHeightMax),
          maritalStatus: prefMaritalStatus,
          educationMin: prefEducationMin || 'Bachelor',
          incomeMin: Number(prefIncomeMin),
          manglikPreference: prefManglik,
          excludeSameGotra,
          preferredCityIds: livingCityId ? [Number(livingCityId)] : [],
          preferredCountries: ['India'],
        }),
      });

      if (res.success) {
        // Wizard completes! Refresh profile in AuthContext
        // This will trigger layout to auto-redirect to (tabs)
        await refreshProfile();
      } else {
        setError(res.error || 'Failed to save preferences');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8B84B" />
        <Text style={styles.loadingText}>Loading configurations... / सेटअप लोड हो रहा है...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.progressBar}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.progressSegment,
                step >= s ? styles.progressActive : styles.progressInactive,
              ]}
            />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.stepTitle}>
            Step {step} of 5 / चरण {step} (5 में से)
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <View>
              <Text style={styles.sectionHeader}>Basic Details / मूल विवरण</Text>
              
              <Text style={styles.label}>Gender / लिंग</Text>
              <View style={styles.row}>
                {(['Male', 'Female'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.radio, gender === g ? styles.radioSelected : null]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={gender === g ? styles.radioTextSelected : styles.radioText}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Gotra / गोत्र</Text>
              <TextInput
                style={styles.input}
                value={gotra}
                placeholder="e.g. Kashyap / जैसे: कश्यप"
                placeholderTextColor="#8A7A60"
                onChangeText={setGotra}
              />

              <Text style={styles.label}>Aakna / आकना</Text>
              <TextInput
                style={styles.input}
                value={aakna}
                placeholder="e.g. Baderiya"
                placeholderTextColor="#8A7A60"
                onChangeText={setAakna}
              />

              <Text style={styles.label}>Manglik Status / मांगलिक स्थिति</Text>
              <View style={styles.pickerRow}>
                {(['Non-Manglik', 'Manglik', 'Anshik Manglik'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.smallRadio, manglikStatus === m ? styles.radioSelected : null]}
                    onPress={() => setManglikStatus(m)}
                  >
                    <Text style={manglikStatus === m ? styles.radioTextSelected : styles.radioText}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Marital Status / वैवाहिक स्थिति</Text>
              <View style={styles.pickerRow}>
                {(['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'] as const).map((ms) => (
                  <TouchableOpacity
                    key={ms}
                    style={[styles.smallRadio, maritalStatus === ms ? styles.radioSelected : null]}
                    onPress={() => setMaritalStatus(ms)}
                  >
                    <Text style={maritalStatus === ms ? styles.radioTextSelected : styles.radioText}>{ms}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Date of Birth / जन्म तिथि</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Day (DD)"
                  placeholderTextColor="#8A7A60"
                  keyboardType="numeric"
                  value={dobDay}
                  onChangeText={setDobDay}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Month (MM)"
                  placeholderTextColor="#8A7A60"
                  keyboardType="numeric"
                  value={dobMonth}
                  onChangeText={setDobMonth}
                />
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Year (YYYY)"
                  placeholderTextColor="#8A7A60"
                  keyboardType="numeric"
                  value={dobYear}
                  onChangeText={setDobYear}
                />
              </View>

              <Text style={styles.label}>Living City / वर्तमान शहर</Text>
              <View style={styles.pickerRow}>
                {citiesList.slice(0, 15).map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={[styles.smallRadio, livingCityId === city.id ? styles.radioSelected : null]}
                    onPress={() => setLivingCityId(city.id)}
                  >
                    <Text style={livingCityId === city.id ? styles.radioTextSelected : styles.radioText}>
                      {city.name} ({city.state?.name})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Height (cm) / ऊंचाई (सेमी)</Text>
              <TextInput
                style={styles.input}
                value={heightCm}
                keyboardType="numeric"
                onChangeText={setHeightCm}
              />

              <Text style={styles.label}>Mobile / मोबाइल</Text>
              <TextInput
                style={styles.input}
                value={mobile}
                keyboardType="phone-pad"
                placeholder="e.g. 98270XXXXX"
                placeholderTextColor="#8A7A60"
                onChangeText={setMobile}
              />

              <TouchableOpacity style={styles.nextButton} onPress={handleSaveStep1} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#1A0800" /> : <Text style={styles.nextText}>Next / आगे बढ़ें</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Education */}
          {step === 2 && (
            <View>
              <Text style={styles.sectionHeader}>Education Details / शैक्षणिक योग्यता</Text>

              <Text style={styles.label}>Highest Degree / उच्चतम डिग्री</Text>
              <TextInput
                style={styles.input}
                value={highestDegree}
                placeholder="e.g. B.Tech / MBA"
                placeholderTextColor="#8A7A60"
                onChangeText={setHighestDegree}
              />

              <Text style={styles.label}>Field of Study / अध्ययन का क्षेत्र</Text>
              <TextInput
                style={styles.input}
                value={fieldOfStudy}
                placeholder="e.g. Computer Science"
                placeholderTextColor="#8A7A60"
                onChangeText={setFieldOfStudy}
              />

              <Text style={styles.label}>Institution / कॉलेज/विश्वविद्यालय</Text>
              <TextInput
                style={styles.input}
                value={institution}
                placeholder="e.g. IIT Delhi"
                placeholderTextColor="#8A7A60"
                onChangeText={setInstitution}
              />

              <Text style={styles.label}>Completion Year / पूर्ण होने का वर्ष</Text>
              <TextInput
                style={styles.input}
                value={completionYear}
                keyboardType="numeric"
                onChangeText={setCompletionYear}
              />

              <View style={styles.row}>
                <TouchableOpacity style={[styles.backStepButton, { flex: 1, marginRight: 8 }]} onPress={() => setStep(1)}>
                  <Text style={styles.backStepText}>Back / पीछे</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextButton, { flex: 2 }]} onPress={handleSaveStep2} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#1A0800" /> : <Text style={styles.nextText}>Next / आगे बढ़ें</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: Occupation */}
          {step === 3 && (
            <View>
              <Text style={styles.sectionHeader}>Occupation Details / व्यवसाय विवरण</Text>

              <Text style={styles.label}>Occupation Type / व्यवसाय का प्रकार</Text>
              <View style={styles.pickerRow}>
                {(['Private Job', 'Government Job', 'Business', 'Self-Employed', 'Not Working'] as const).map((occ) => (
                  <TouchableOpacity
                    key={occ}
                    style={[styles.smallRadio, occupationType === occ ? styles.radioSelected : null]}
                    onPress={() => setOccupationType(occ)}
                  >
                    <Text style={occupationType === occ ? styles.radioTextSelected : styles.radioText}>{occ}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Job Title / पद का नाम</Text>
              <TextInput
                style={styles.input}
                value={jobTitle}
                placeholder="e.g. software engineer"
                placeholderTextColor="#8A7A60"
                onChangeText={setJobTitle}
              />

              <Text style={styles.label}>Employer / कंपनी/संगठन</Text>
              <TextInput
                style={styles.input}
                value={employer}
                placeholder="e.g. Google"
                placeholderTextColor="#8A7A60"
                onChangeText={setEmployer}
              />

              <Text style={styles.label}>Annual Income Range (₹) / वार्षिक आय</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Min (₹)"
                  placeholderTextColor="#8A7A60"
                  keyboardType="numeric"
                  value={annualIncomeMin}
                  onChangeText={setAnnualIncomeMin}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Max (₹)"
                  placeholderTextColor="#8A7A60"
                  keyboardType="numeric"
                  value={annualIncomeMax}
                  onChangeText={setAnnualIncomeMax}
                />
              </View>

              <View style={styles.row}>
                <TouchableOpacity style={[styles.backStepButton, { flex: 1, marginRight: 8 }]} onPress={() => setStep(2)}>
                  <Text style={styles.backStepText}>Back / पीछे</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextButton, { flex: 2 }]} onPress={handleSaveStep3} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#1A0800" /> : <Text style={styles.nextText}>Next / आगे बढ़ें</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: Family Details */}
          {step === 4 && (
            <View>
              <Text style={styles.sectionHeader}>Family Details / पारिवारिक पृष्ठभूमि</Text>

              <Text style={styles.label}>Father's Name / पिता का नाम</Text>
              <TextInput
                style={styles.input}
                value={fatherName}
                onChangeText={setFatherName}
              />

              <Text style={styles.label}>Father's Mobile / पिता का मोबाइल</Text>
              <TextInput
                style={styles.input}
                value={fatherMobile}
                keyboardType="phone-pad"
                onChangeText={setFatherMobile}
              />

              <Text style={styles.label}>Father's Occupation / पिता का व्यवसाय</Text>
              <TextInput
                style={styles.input}
                value={fatherOccupation}
                onChangeText={setFatherOccupation}
              />

              <Text style={styles.label}>Mother's Name / माता का नाम</Text>
              <TextInput
                style={styles.input}
                value={motherName}
                onChangeText={setMotherName}
              />

              <Text style={styles.label}>Family Type / परिवार का प्रकार</Text>
              <View style={styles.row}>
                {(['Nuclear', 'Joint', 'Extended'] as const).map((ft) => (
                  <TouchableOpacity
                    key={ft}
                    style={[styles.radio, familyType === ft ? styles.radioSelected : null]}
                    onPress={() => setFamilyType(ft)}
                  >
                    <Text style={familyType === ft ? styles.radioTextSelected : styles.radioText}>{ft}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Home Address / वर्तमान पता</Text>
              <TextInput
                style={styles.input}
                value={homeAddress}
                placeholder="Enter complete address"
                placeholderTextColor="#8A7A60"
                onChangeText={setHomeAddress}
              />

              <View style={styles.row}>
                <TouchableOpacity style={[styles.backStepButton, { flex: 1, marginRight: 8 }]} onPress={() => setStep(3)}>
                  <Text style={styles.backStepText}>Back / पीछे</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextButton, { flex: 2 }]} onPress={handleSaveStep4} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#1A0800" /> : <Text style={styles.nextText}>Next / आगे बढ़ें</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 5: Preferences */}
          {step === 5 && (
            <View>
              <Text style={styles.sectionHeader}>Partner Preferences / जीवनसाथी की पसंद</Text>

              <Text style={styles.label}>Partner Age Range / उम्र सीमा</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Min"
                  placeholderTextColor="#8A7A60"
                  keyboardType="numeric"
                  value={prefAgeMin}
                  onChangeText={setPrefAgeMin}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Max"
                  placeholderTextColor="#8A7A60"
                  keyboardType="numeric"
                  value={prefAgeMax}
                  onChangeText={setPrefAgeMax}
                />
              </View>

              <Text style={styles.label}>Partner Height Range (cm) / ऊंचाई सीमा</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Min cm"
                  placeholderTextColor="#8A7A60"
                  keyboardType="numeric"
                  value={prefHeightMin}
                  onChangeText={setPrefHeightMin}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Max cm"
                  placeholderTextColor="#8A7A60"
                  keyboardType="numeric"
                  value={prefHeightMax}
                  onChangeText={setPrefHeightMax}
                />
              </View>

              <Text style={styles.label}>Manglik Preference / मांगलिक पसंद</Text>
              <View style={styles.row}>
                {(['Any', 'Non-Manglik', 'Manglik'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.radio, prefManglik === p ? styles.radioSelected : null]}
                    onPress={() => setPrefManglik(p)}
                  >
                    <Text style={prefManglik === p ? styles.radioTextSelected : styles.radioText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.row, { alignItems: 'center', justifyContent: 'space-between', marginVertical: 16 }]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: '#D4BFA0', fontSize: 15, fontWeight: '600' }}>
                    Exclude Same Gotra / समान गोत्र निषेध
                  </Text>
                  <Text style={{ color: '#8A7A60', fontSize: 12, marginTop: 4 }}>
                    Strictly hide profiles sharing your gotra
                  </Text>
                </View>
                <Switch
                  value={excludeSameGotra}
                  onValueChange={setExcludeSameGotra}
                  trackColor={{ false: '#2C1A10', true: '#E8B84B' }}
                  thumbColor={excludeSameGotra ? '#1A0800' : '#8A7A60'}
                />
              </View>

              <View style={styles.row}>
                <TouchableOpacity style={[styles.backStepButton, { flex: 1, marginRight: 8 }]} onPress={() => setStep(4)}>
                  <Text style={styles.backStepText}>Back / पीछे</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextButton, { flex: 2 }]} onPress={handleSaveStep5} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#1A0800" /> : <Text style={styles.nextText}>Complete / पूर्ण करें</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0800',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A0800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#D4BFA0',
    marginTop: 16,
    fontSize: 15,
  },
  progressBar: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: '#2C1A10',
    width: '100%',
  },
  progressSegment: {
    flex: 1,
    height: '100%',
  },
  progressActive: {
    backgroundColor: '#E8B84B',
  },
  progressInactive: {
    backgroundColor: '#2C1A10',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  stepTitle: {
    color: '#E8B84B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 24,
  },
  label: {
    color: '#D4BFA0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C1A10',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3D281C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  radio: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3D281C',
    backgroundColor: '#2C1A10',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  smallRadio: {
    borderWidth: 1,
    borderColor: '#3D281C',
    backgroundColor: '#2C1A10',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  radioSelected: {
    borderColor: '#E8B84B',
    backgroundColor: '#FFF9F0',
  },
  radioText: {
    color: '#D4BFA0',
    fontWeight: '600',
    fontSize: 14,
  },
  radioTextSelected: {
    color: '#1A0800',
    fontWeight: '700',
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: '#E8B84B',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  nextText: {
    color: '#1A0800',
    fontSize: 16,
    fontWeight: '700',
  },
  backStepButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8A7A60',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  backStepText: {
    color: '#8A7A60',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF6F61',
    fontSize: 14,
    marginVertical: 12,
    fontWeight: '500',
  },
});
