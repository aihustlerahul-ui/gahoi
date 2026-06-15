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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GENDER_OPTIONS,
  MANGLIK_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  COMPLEXION_OPTIONS,
  PROFILE_CREATED_BY_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  DISABILITY_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  DIETARY_HABIT_OPTIONS,
  NAKSHATRA_OPTIONS,
  nakshatraLabelForEnglish,
  zodiacLabelForEnglish,
  ZODIAC_OPTIONS,
  HEIGHT_FT_OPTIONS,
  HEIGHT_IN_OPTIONS,
  OCCUPATION_TYPE_OPTIONS,
  FAMILY_TYPE_OPTIONS,
  FAMILY_STATUS_OPTIONS,
  HAS_HOUSE_OPTIONS,
  EDUCATION_DEGREE_OPTIONS,
  MANGLIK_PREFERENCE_OPTIONS,
  INCOME_RANGE_OPTIONS,
  time12To24String,
  time24StringTo12,
  resolveHeightFtIn,
} from '@gahoisarthi/shared';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { apiRequest } from '../../src/lib/api';
import { OptionPicker } from '../../src/components/profile/OptionPicker';

type GotraOption = {
  id: number;
  key: string;
  name: string;
  label: string;
  gotraHindi: string;
  gotraEnglish: string;
  rishi: string | null;
  kuldevi: string | null;
  aaknas: { id: number; name: string }[];
};

type NakshatraOption = {
  code: string;
  english: string;
  hindi: string;
  label: string;
};

type ZodiacOption = {
  code: string;
  english: string;
  hindi: string;
  label: string;
};

type CountryOption = { id: number; name: string; iso2: string };
type StateOption = { id: number; name: string; countryId: number };
type CityOption = { id: number; name: string; state: { id: number; name: string; countryId: number } };

const BIRTH_HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ProfileWizardScreen() {
  const router = useRouter();
  const { userProfile, refreshProfile, logoutUser } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const [gotrasList, setGotrasList] = useState<GotraOption[]>([]);
  const [aaknaMasterList, setAaknaMasterList] = useState<{ id: number; name: string }[]>([]);
  const [nakshatraList, setNakshatraList] = useState<NakshatraOption[]>(
    NAKSHATRA_OPTIONS.map((english) => ({
      code: english.toUpperCase().replace(/\s+/g, '_'),
      english,
      hindi: '',
      label: nakshatraLabelForEnglish(english),
    })),
  );
  const [zodiacList, setZodiacList] = useState<ZodiacOption[]>(
    ZODIAC_OPTIONS.map((english) => ({
      code: english.toUpperCase(),
      english,
      hindi: '',
      label: zodiacLabelForEnglish(english),
    })),
  );
  const [countriesList, setCountriesList] = useState<CountryOption[]>([]);
  const [livingStatesList, setLivingStatesList] = useState<StateOption[]>([]);
  const [birthStatesList, setBirthStatesList] = useState<StateOption[]>([]);
  const [livingCitiesList, setLivingCitiesList] = useState<CityOption[]>([]);
  const [birthCitiesList, setBirthCitiesList] = useState<CityOption[]>([]);

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<(typeof GENDER_OPTIONS)[number]>('Male');
  const [profileCreatedBy, setProfileCreatedBy] = useState<(typeof PROFILE_CREATED_BY_OPTIONS)[number]>('Self');
  const [gotraId, setGotraId] = useState<number | null>(null);
  const [aaknaId, setAaknaId] = useState<number | null>(null);
  const [motherTongue, setMotherTongue] = useState<(typeof MOTHER_TONGUE_OPTIONS)[number]>('Hindi');
  const [manglikStatus, setManglikStatus] = useState<(typeof MANGLIK_OPTIONS)[number]>('Non-Manglik');
  const [maritalStatus, setMaritalStatus] = useState<(typeof MARITAL_STATUS_OPTIONS)[number]>('Never Married');
  const [dobYear, setDobYear] = useState('1996');
  const [dobMonth, setDobMonth] = useState('03');
  const [dobDay, setDobDay] = useState('30');
  const [birthHour, setBirthHour] = useState(12);
  const [birthMinute, setBirthMinute] = useState(0);
  const [birthAmPm, setBirthAmPm] = useState<'AM' | 'PM'>('AM');
  const [livingCountryId, setLivingCountryId] = useState<number | null>(null);
  const [livingStateId, setLivingStateId] = useState<number | null>(null);
  const [birthCountryId, setBirthCountryId] = useState<number | null>(null);
  const [birthStateId, setBirthStateId] = useState<number | null>(null);
  const [birthCityId, setBirthCityId] = useState<number | null>(null);
  const [nakshatra, setNakshatra] = useState<(typeof NAKSHATRA_OPTIONS)[number]>('Pushya');
  const [zodiac, setZodiac] = useState<(typeof ZODIAC_OPTIONS)[number]>('Cancer');
  const [heightFt, setHeightFt] = useState<(typeof HEIGHT_FT_OPTIONS)[number]>(5);
  const [heightIn, setHeightIn] = useState<(typeof HEIGHT_IN_OPTIONS)[number]>(6);
  const [weightKg, setWeightKg] = useState('65');
  const [complexion, setComplexion] = useState<(typeof COMPLEXION_OPTIONS)[number]>('Wheatish');
  const [disability, setDisability] = useState<(typeof DISABILITY_OPTIONS)[number]>('No');
  const [bloodGroup, setBloodGroup] = useState<(typeof BLOOD_GROUP_OPTIONS)[number]>('B+');
  const [dietaryHabit, setDietaryHabit] = useState<(typeof DIETARY_HABIT_OPTIONS)[number]>('Veg');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [livingCityId, setLivingCityId] = useState<number | null>(null);
  const [town, setTown] = useState('');
  const [nativeState, setNativeState] = useState('');
  const [aboutMe, setAboutMe] = useState('');

  // Step 2
  const [highestDegree, setHighestDegree] = useState<(typeof EDUCATION_DEGREE_OPTIONS)[number]>('BCom');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [completionYear, setCompletionYear] = useState('2020');
  const [educationalDetail, setEducationalDetail] = useState('');

  // Step 3
  const [occupationType, setOccupationType] = useState<(typeof OCCUPATION_TYPE_OPTIONS)[number]>('Private Job');
  const [jobTitle, setJobTitle] = useState('');
  const [employer, setEmployer] = useState('');
  const [occupationDetail, setOccupationDetail] = useState('');
  const [incomeRangeLabel, setIncomeRangeLabel] = useState<(typeof INCOME_RANGE_OPTIONS)[number]['label']>('₹3–5 lakh');

  // Step 4
  const [fatherName, setFatherName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [marriedBrothers, setMarriedBrothers] = useState('0');
  const [unmarriedBrothers, setUnmarriedBrothers] = useState('0');
  const [marriedSisters, setMarriedSisters] = useState('0');
  const [unmarriedSisters, setUnmarriedSisters] = useState('0');
  const [maternalUncleName, setMaternalUncleName] = useState('');
  const [maternalUncleAaknaId, setMaternalUncleAaknaId] = useState<number | null>(null);
  const [maternalAaknaSearch, setMaternalAaknaSearch] = useState('');
  const [familyType, setFamilyType] = useState<(typeof FAMILY_TYPE_OPTIONS)[number]>('Nuclear');
  const [familyStatus, setFamilyStatus] = useState<(typeof FAMILY_STATUS_OPTIONS)[number]>('Middle Class');
  const [hasHouse, setHasHouse] = useState<(typeof HAS_HOUSE_OPTIONS)[number]>('No');
  const [hasCar, setHasCar] = useState(false);
  const [homeAddress, setHomeAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');

  // Step 5
  const [prefAgeMin, setPrefAgeMin] = useState('22');
  const [prefAgeMax, setPrefAgeMax] = useState('30');
  const [prefHeightMinFt, setPrefHeightMinFt] = useState<(typeof HEIGHT_FT_OPTIONS)[number]>(4);
  const [prefHeightMinIn, setPrefHeightMinIn] = useState<(typeof HEIGHT_IN_OPTIONS)[number]>(11);
  const [prefHeightMaxFt, setPrefHeightMaxFt] = useState<(typeof HEIGHT_FT_OPTIONS)[number]>(6);
  const [prefHeightMaxIn, setPrefHeightMaxIn] = useState<(typeof HEIGHT_IN_OPTIONS)[number]>(1);
  const [prefMaritalStatus, setPrefMaritalStatus] = useState<string[]>(['Never Married']);
  const [prefEducationMin, setPrefEducationMin] = useState<(typeof EDUCATION_DEGREE_OPTIONS)[number]>('BCom');
  const [prefIncomeMin, setPrefIncomeMin] = useState('300000');
  const [prefManglik, setPrefManglik] = useState<(typeof MANGLIK_PREFERENCE_OPTIONS)[number]>('Any');
  const [excludeSameGotra, setExcludeSameGotra] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const selectedIncome = INCOME_RANGE_OPTIONS.find((r) => r.label === incomeRangeLabel) ?? INCOME_RANGE_OPTIONS[1];
  const selectedGotra = gotrasList.find((g) => g.id === gotraId) ?? null;
  const aaknasForGotra = selectedGotra?.aaknas ?? [];
  const nakshatraOptions = nakshatraList.map((entry) => entry.english) as readonly (typeof NAKSHATRA_OPTIONS)[number][];
  const nakshatraLabelByEnglish = new Map(nakshatraList.map((entry) => [entry.english, entry.label]));
  const zodiacOptions = zodiacList.map((entry) => entry.english) as readonly (typeof ZODIAC_OPTIONS)[number][];
  const zodiacLabelByEnglish = new Map(zodiacList.map((entry) => [entry.english, entry.label]));
  const filteredMaternalAaknas = aaknaMasterList.filter((a) => {
    const q = maternalAaknaSearch.trim().toLowerCase();
    if (!q) return true;
    return a.name.toLowerCase().includes(q);
  });

  const handleGotraSelect = (id: number) => {
    setGotraId(id);
    setAaknaId(null);
  };

  const loadStatesForCountry = async (countryId: number, target: 'living' | 'birth') => {
    const res = await apiRequest(`/profile/metadata/states?countryId=${countryId}`);
    if (res.success && res.data) {
      if (target === 'living') setLivingStatesList(res.data);
      else setBirthStatesList(res.data);
      return res.data as StateOption[];
    }
    return [];
  };

  const loadCitiesForState = async (stateId: number, target: 'living' | 'birth') => {
    const res = await apiRequest(`/profile/metadata/cities?stateId=${stateId}`);
    if (res.success && res.data) {
      if (target === 'living') setLivingCitiesList(res.data);
      else setBirthCitiesList(res.data);
      return res.data as CityOption[];
    }
    return [];
  };

  const handleLivingCountrySelect = async (countryId: number) => {
    setLivingCountryId(countryId);
    setLivingStateId(null);
    setLivingCityId(null);
    setLivingCitiesList([]);
    const states = await loadStatesForCountry(countryId, 'living');
    if (states.length > 0) {
      setLivingStateId(states[0].id);
      const cities = await loadCitiesForState(states[0].id, 'living');
      if (cities.length > 0) setLivingCityId(cities[0].id);
    }
  };

  const handleLivingStateSelect = async (stateId: number) => {
    setLivingStateId(stateId);
    setLivingCityId(null);
    const cities = await loadCitiesForState(stateId, 'living');
    if (cities.length > 0) setLivingCityId(cities[0].id);
  };

  const handleBirthCountrySelect = async (countryId: number) => {
    setBirthCountryId(countryId);
    setBirthStateId(null);
    setBirthCityId(null);
    setBirthCitiesList([]);
    const states = await loadStatesForCountry(countryId, 'birth');
    if (states.length > 0) {
      setBirthStateId(states[0].id);
      const cities = await loadCitiesForState(states[0].id, 'birth');
      if (cities.length > 0) setBirthCityId(cities[0].id);
    }
  };

  const handleBirthStateSelect = async (stateId: number) => {
    setBirthStateId(stateId);
    setBirthCityId(null);
    const cities = await loadCitiesForState(stateId, 'birth');
    if (cities.length > 0) setBirthCityId(cities[0].id);
  };

  useEffect(() => {
    async function loadMetadata() {
      setLoading(true);
      try {
        const [gotrasRes, aaknasRes, nakshatrasRes, zodiacRes, countriesRes] = await Promise.all([
          apiRequest('/profile/metadata/gotras'),
          apiRequest('/profile/metadata/aaknas'),
          apiRequest('/profile/metadata/nakshatras'),
          apiRequest('/profile/metadata/zodiac'),
          apiRequest('/profile/metadata/countries'),
        ]);
        if (gotrasRes.success && gotrasRes.data) {
          setGotrasList(gotrasRes.data);
          if (!gotraId && gotrasRes.data.length > 0) {
            setGotraId(gotrasRes.data[0].id);
          }
        }
        if (aaknasRes.success && aaknasRes.data) {
          setAaknaMasterList(aaknasRes.data);
        }
        if (nakshatrasRes.success && nakshatrasRes.data) {
          setNakshatraList(nakshatrasRes.data);
        }
        if (zodiacRes.success && zodiacRes.data) {
          setZodiacList(zodiacRes.data);
        }
        if (countriesRes.success && countriesRes.data?.length) {
          setCountriesList(countriesRes.data);
          const defaultCountry = countriesRes.data.find((c: CountryOption) => c.iso2 === 'IN') ?? countriesRes.data[0];
          if (!livingCountryId) await handleLivingCountrySelect(defaultCountry.id);
          if (!birthCountryId) await handleBirthCountrySelect(defaultCountry.id);
        }
      } catch {
        setError('Failed to load list details / विवरण लोड करने में असमर्थ');
      } finally {
        setLoading(false);
      }
    }
    loadMetadata();
  }, []);

  useEffect(() => {
    if (!userProfile || hasPrefilled) return;
    const needsGotraList = !userProfile.gotraId && !!userProfile.gotra;
    if (needsGotraList && gotrasList.length === 0) return;

    if (userProfile.firstName) setFirstName(userProfile.firstName);
    if (userProfile.lastName) setLastName(userProfile.lastName);
    if (userProfile.gender) setGender(userProfile.gender);
    if (userProfile.profileCreatedBy) setProfileCreatedBy(userProfile.profileCreatedBy);
    if (userProfile.gotraId) setGotraId(userProfile.gotraId);
    else if (userProfile.gotra && gotrasList.length > 0) {
      const match = gotrasList.find((g) => g.name === userProfile.gotra || g.gotraEnglish === userProfile.gotra);
      if (match) setGotraId(match.id);
    }
    if (userProfile.aaknaId) setAaknaId(userProfile.aaknaId);
    if (userProfile.motherTongue) setMotherTongue(userProfile.motherTongue);
    if (userProfile.manglikStatus) setManglikStatus(userProfile.manglikStatus);
    if (userProfile.maritalStatus) setMaritalStatus(userProfile.maritalStatus);
    if (userProfile.dateOfBirth) {
      const dob = new Date(userProfile.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        setDobYear(String(dob.getFullYear()));
        setDobMonth(String(dob.getMonth() + 1).padStart(2, '0'));
        setDobDay(String(dob.getDate()).padStart(2, '0'));
      }
    }
    if (userProfile.timeOfBirth) {
      const t12 = time24StringTo12(userProfile.timeOfBirth);
      setBirthHour(t12.hour);
      setBirthMinute(t12.minute);
      setBirthAmPm(t12.ampm);
    }
    if (userProfile.countryId) setLivingCountryId(userProfile.countryId);
    if (userProfile.birthCityId) setBirthCityId(userProfile.birthCityId);
    if (userProfile.nakshatra) setNakshatra(userProfile.nakshatra);
    if (userProfile.zodiac) setZodiac(userProfile.zodiac);
    const resolvedHeight = resolveHeightFtIn(
      userProfile.heightFt,
      userProfile.heightIn,
      userProfile.height_cm,
    );
    if (resolvedHeight.ft != null) {
      setHeightFt(resolvedHeight.ft as (typeof HEIGHT_FT_OPTIONS)[number]);
      setHeightIn((resolvedHeight.in ?? 0) as (typeof HEIGHT_IN_OPTIONS)[number]);
    }
    if (userProfile.weightKg) setWeightKg(String(userProfile.weightKg));
    if (userProfile.complexion) setComplexion(userProfile.complexion);
    if (userProfile.disability) setDisability(userProfile.disability);
    if (userProfile.bloodGroup) setBloodGroup(userProfile.bloodGroup);
    if (userProfile.dietaryHabit) setDietaryHabit(userProfile.dietaryHabit);
    if (userProfile.mobile) setMobile(userProfile.mobile);
    if (userProfile.whatsapp) setWhatsapp(userProfile.whatsapp);
    if (userProfile.livingCityId) setLivingCityId(userProfile.livingCityId);
    if (userProfile.town) setTown(userProfile.town);
    if (userProfile.nativeState) setNativeState(userProfile.nativeState);
    if (userProfile.aboutMe) setAboutMe(userProfile.aboutMe);

    if (userProfile.education) {
      if (userProfile.education.highestDegree) setHighestDegree(userProfile.education.highestDegree);
      if (userProfile.education.fieldOfStudy) setFieldOfStudy(userProfile.education.fieldOfStudy);
      if (userProfile.education.institution) setInstitution(userProfile.education.institution);
      if (userProfile.education.completionYear) setCompletionYear(String(userProfile.education.completionYear));
      if (userProfile.education.educationalDetail) setEducationalDetail(userProfile.education.educationalDetail);
    }

    if (userProfile.occupation) {
      if (userProfile.occupation.type) setOccupationType(userProfile.occupation.type);
      if (userProfile.occupation.jobTitle) setJobTitle(userProfile.occupation.jobTitle);
      if (userProfile.occupation.employer) setEmployer(userProfile.occupation.employer);
      if (userProfile.occupation.occupationDetail) setOccupationDetail(userProfile.occupation.occupationDetail);
      if (userProfile.occupation.annualIncomeMin != null) {
        const match = INCOME_RANGE_OPTIONS.find(
          (r) => r.min === userProfile.occupation.annualIncomeMin
        );
        if (match) setIncomeRangeLabel(match.label);
      }
    }

    if (userProfile.family) {
      if (userProfile.family.fatherName) setFatherName(userProfile.family.fatherName);
      if (userProfile.family.parentMobile) setParentMobile(userProfile.family.parentMobile);
      if (userProfile.family.fatherOccupation) setFatherOccupation(userProfile.family.fatherOccupation);
      if (userProfile.family.motherName) setMotherName(userProfile.family.motherName);
      if (userProfile.family.motherOccupation) setMotherOccupation(userProfile.family.motherOccupation);
      if (userProfile.family.marriedBrothers != null) setMarriedBrothers(String(userProfile.family.marriedBrothers));
      if (userProfile.family.unmarriedBrothers != null) setUnmarriedBrothers(String(userProfile.family.unmarriedBrothers));
      if (userProfile.family.marriedSisters != null) setMarriedSisters(String(userProfile.family.marriedSisters));
      if (userProfile.family.unmarriedSisters != null) setUnmarriedSisters(String(userProfile.family.unmarriedSisters));
      if (userProfile.family.maternalUncleName) setMaternalUncleName(userProfile.family.maternalUncleName);
      if (userProfile.family.maternalUncleAaknaId) setMaternalUncleAaknaId(userProfile.family.maternalUncleAaknaId);
      if (userProfile.family.familyType) setFamilyType(userProfile.family.familyType);
      if (userProfile.family.familyStatus) setFamilyStatus(userProfile.family.familyStatus);
      if (userProfile.family.hasHouse) setHasHouse(userProfile.family.hasHouse);
      if (userProfile.family.hasCar != null) setHasCar(userProfile.family.hasCar);
      if (userProfile.family.homeAddress) setHomeAddress(userProfile.family.homeAddress);
      if (userProfile.family.permanentAddress) setPermanentAddress(userProfile.family.permanentAddress);
    }

    if (userProfile.preferences) {
      if (userProfile.preferences.ageMin) setPrefAgeMin(String(userProfile.preferences.ageMin));
      if (userProfile.preferences.ageMax) setPrefAgeMax(String(userProfile.preferences.ageMax));
      const prefMin = resolveHeightFtIn(
        userProfile.preferences.heightMinFt,
        userProfile.preferences.heightMinIn,
        userProfile.preferences.heightMinCm,
      );
      const prefMax = resolveHeightFtIn(
        userProfile.preferences.heightMaxFt,
        userProfile.preferences.heightMaxIn,
        userProfile.preferences.heightMaxCm,
      );
      if (prefMin.ft != null) {
        setPrefHeightMinFt(prefMin.ft as (typeof HEIGHT_FT_OPTIONS)[number]);
        setPrefHeightMinIn((prefMin.in ?? 0) as (typeof HEIGHT_IN_OPTIONS)[number]);
      }
      if (prefMax.ft != null) {
        setPrefHeightMaxFt(prefMax.ft as (typeof HEIGHT_FT_OPTIONS)[number]);
        setPrefHeightMaxIn((prefMax.in ?? 0) as (typeof HEIGHT_IN_OPTIONS)[number]);
      }
      if (userProfile.preferences.maritalStatus) setPrefMaritalStatus(userProfile.preferences.maritalStatus);
      if (userProfile.preferences.educationMin) setPrefEducationMin(userProfile.preferences.educationMin);
      if (userProfile.preferences.incomeMin) setPrefIncomeMin(String(userProfile.preferences.incomeMin));
      if (userProfile.preferences.manglikPreference) setPrefManglik(userProfile.preferences.manglikPreference);
      if (userProfile.preferences.excludeSameGotra !== undefined) setExcludeSameGotra(userProfile.preferences.excludeSameGotra);
    }

    if (userProfile.termsAcceptedAt) setTermsAccepted(true);

    if (!userProfile.firstName || !userProfile.mobile || !userProfile.livingCityId) setStep(1);
    else if (!userProfile.education?.highestDegree) setStep(2);
    else if (!userProfile.occupation?.type) setStep(3);
    else if (!userProfile.family?.fatherName) setStep(4);
    else if (!userProfile.preferences) setStep(5);
    else setStep(5);

    setHasPrefilled(true);
  }, [userProfile, hasPrefilled, gotrasList]);

  useEffect(() => {
    if (!userProfile || !countriesList.length) return;

    async function restoreLocationCascade(
      cityId: number | null | undefined,
      target: 'living' | 'birth',
    ) {
      if (!cityId) return;
      const res = await apiRequest('/profile/metadata/cities');
      if (!res.success || !res.data) return;
      const city = res.data.find((c: CityOption) => c.id === cityId);
      if (!city?.state) return;

      if (target === 'living') {
        setLivingCountryId(city.state.countryId);
        await loadStatesForCountry(city.state.countryId, 'living');
        setLivingStateId(city.state.id);
        await loadCitiesForState(city.state.id, 'living');
        setLivingCityId(cityId);
      } else {
        setBirthCountryId(city.state.countryId);
        await loadStatesForCountry(city.state.countryId, 'birth');
        setBirthStateId(city.state.id);
        await loadCitiesForState(city.state.id, 'birth');
        setBirthCityId(cityId);
      }
    }

    if (userProfile.livingCityId) restoreLocationCascade(userProfile.livingCityId, 'living');
    if (userProfile.birthCityId) restoreLocationCascade(userProfile.birthCityId, 'birth');
  }, [userProfile?.livingCityId, userProfile?.birthCityId, countriesList.length]);

  const togglePrefMarital = (status: string) => {
    setPrefMaritalStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const showValidationError = (msg: string) => {
    setError(msg);
    // Alert is a fallback for native; web uses inline error shown in nav row
    if (typeof window === 'undefined') Alert.alert('Required / आवश्यक', msg);
  };

  const handleSaveStep1 = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showValidationError('First and last name are required / नाम आवश्यक है');
      return;
    }
    if (!gotraId) {
      showValidationError('Gotra is required / गोत्र आवश्यक है');
      return;
    }
    if (aaknasForGotra.length > 0 && !aaknaId) {
      showValidationError('Aakna is required / आकना आवश्यक है');
      return;
    }
    if (!mobile || mobile.length < 10) {
      showValidationError('Mobile number required (10 digits) / मोबाइल नंबर आवश्यक है');
      return;
    }
    if (!livingCityId) {
      showValidationError('Current city is required / वर्तमान शहर आवश्यक है');
      return;
    }
    if (!birthCityId) {
      showValidationError('Birth city is required / जन्म शहर आवश्यक है');
      return;
    }

    setSubmitting(true);
    setError(null);
    const dobString = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}T00:00:00.000Z`;
    const timeOfBirth24 = time12To24String(birthHour, birthMinute, birthAmPm);

    try {
      const res = await apiRequest('/profile/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender,
          profileCreatedBy,
          gotraId: Number(gotraId),
          ...(aaknaId ? { aaknaId: Number(aaknaId) } : {}),
          motherTongue,
          manglikStatus,
          maritalStatus,
          dateOfBirth: dobString,
          timeOfBirth: timeOfBirth24,
          birthCityId: Number(birthCityId),
          nakshatra,
          zodiac,
          heightFt: Number(heightFt),
          heightIn: Number(heightIn),
          weightKg: Number(weightKg),
          complexion,
          disability,
          bloodGroup,
          dietaryHabit,
          mobile,
          whatsapp: whatsapp || mobile,
          livingCityId: Number(livingCityId),
          town: town.trim(),
          nativeState: nativeState.trim(),
          aboutMe: aboutMe.trim(),
          countryId: livingCountryId ?? 1,
        }),
      });
      if (res.success) setStep(2);
      else setError(res.error || 'Failed to save basic details');
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
          highestDegree,
          fieldOfStudy: fieldOfStudy.trim(),
          institution: institution.trim(),
          completionYear: Number(completionYear),
          educationalDetail: educationalDetail.trim(),
        }),
      });
      if (res.success) setStep(3);
      else setError(res.error || 'Failed to save education details');
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
          jobTitle: jobTitle.trim(),
          employer: employer.trim(),
          occupationDetail: occupationDetail.trim(),
          annualIncomeMin: selectedIncome.min,
          annualIncomeMax: selectedIncome.max,
        }),
      });
      if (res.success) setStep(4);
      else setError(res.error || 'Failed to save occupation details');
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStep4 = async () => {
    if (!fatherName.trim()) {
      showValidationError("Father's name is required / पिता का नाम आवश्यक है");
      return;
    }
    setSubmitting(true);
    setError(null);
    const totalSiblings =
      Number(marriedBrothers) +
      Number(unmarriedBrothers) +
      Number(marriedSisters) +
      Number(unmarriedSisters);

    try {
      const res = await apiRequest('/profile/me/family', {
        method: 'PATCH',
        body: JSON.stringify({
          fatherName: fatherName.trim(),
          parentMobile: parentMobile.trim(),
          fatherOccupation: fatherOccupation.trim(),
          motherName: motherName.trim(),
          motherOccupation: motherOccupation.trim(),
          siblings: totalSiblings,
          marriedBrothers: Number(marriedBrothers),
          unmarriedBrothers: Number(unmarriedBrothers),
          marriedSisters: Number(marriedSisters),
          unmarriedSisters: Number(unmarriedSisters),
          maternalUncleName: maternalUncleName.trim(),
          ...(maternalUncleAaknaId ? { maternalUncleAaknaId: Number(maternalUncleAaknaId) } : {}),
          familyType,
          familyStatus,
          hasHouse,
          hasCar,
          homeAddress: homeAddress.trim(),
          permanentAddress: permanentAddress.trim(),
        }),
      });
      if (res.success) setStep(5);
      else setError(res.error || 'Failed to save family details');
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStep5 = async () => {
    if (!termsAccepted) {
      showValidationError('Please accept the terms to continue / जारी रखने के लिए नियम स्वीकार करें');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiRequest('/profile/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          ageMin: Number(prefAgeMin),
          ageMax: Number(prefAgeMax),
          heightMinFt: Number(prefHeightMinFt),
          heightMinIn: Number(prefHeightMinIn),
          heightMaxFt: Number(prefHeightMaxFt),
          heightMaxIn: Number(prefHeightMaxIn),
          maritalStatus: prefMaritalStatus.length ? prefMaritalStatus : ['Never Married'],
          educationMin: prefEducationMin,
          incomeMin: Number(prefIncomeMin),
          manglikPreference: prefManglik,
          excludeSameGotra,
          preferredCityIds: livingCityId ? [Number(livingCityId)] : [],
          preferredCountries: ['India'],
          termsAccepted: true,
        }),
      });
      if (res.success) {
        await refreshProfile();
        router.replace('/(tabs)');
      } else {
        setError(res.error || 'Failed to save preferences');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderNavButtons = (onNext: () => void, backStep?: number) => (
    <View>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠ {error}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        {backStep != null && (
          <TouchableOpacity style={[styles.backStepButton, { flex: 1, marginRight: 8 }]} onPress={() => { setStep(backStep); setError(null); }}>
            <Text style={styles.backStepText}>Back / पीछे</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, { flex: backStep != null ? 2 : 1 }]}
          onPress={onNext}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextText}>
              {step === 5 ? 'Complete / पूर्ण करें' : 'Next / आगे बढ़ें'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B5620E" />
        <Text style={styles.loadingText}>Loading configurations... / सेटअप लोड हो रहा है...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.progressBar}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View key={s} style={[styles.progressSegment, step >= s ? styles.progressActive : styles.progressInactive]} />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.stepRow}>
            <Text style={styles.stepTitle}>Step {step} of 5 / चरण {step} (5 में से)</Text>
            <TouchableOpacity onPress={() => logoutUser()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.wrongAccount}>Wrong account?</Text>
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}

          {step === 1 && (
            <View>
              <Text style={styles.sectionHeader}>Basic Details / मूल विवरण</Text>

              <Text style={styles.label}>First Name / पहला नाम</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholderTextColor="#8A7A60" />

              <Text style={styles.label}>Last Name / उपनाम</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholderTextColor="#8A7A60" />

              <OptionPicker label="Gender / लिंग" options={GENDER_OPTIONS} value={gender} onChange={setGender} />
              <OptionPicker
                label="Profile Created By / प्रोफ़ाइल किसने बनाई"
                options={PROFILE_CREATED_BY_OPTIONS}
                value={profileCreatedBy}
                onChange={setProfileCreatedBy}
                compact
              />

              <Text style={styles.label}>Gotra / गोत्र</Text>
              <View style={styles.pickerRow}>
                {gotrasList.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.smallRadio, gotraId === g.id ? styles.radioSelected : null]}
                    onPress={() => handleGotraSelect(g.id)}
                  >
                    <Text style={gotraId === g.id ? styles.radioTextSelected : styles.radioText}>{g.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedGotra?.kuldevi ? (
                <Text style={styles.hint}>Kuldevi / कुलदेवी: {selectedGotra.kuldevi}</Text>
              ) : null}

              {aaknasForGotra.length > 0 && (
                <>
                  <Text style={styles.label}>Aakna / आकना</Text>
                  <View style={styles.pickerRow}>
                    {aaknasForGotra.map((a) => (
                      <TouchableOpacity
                        key={a.id}
                        style={[styles.smallRadio, aaknaId === a.id ? styles.radioSelected : null]}
                        onPress={() => setAaknaId(a.id)}
                      >
                        <Text style={aaknaId === a.id ? styles.radioTextSelected : styles.radioText}>{a.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              {selectedGotra && aaknasForGotra.length === 0 && (
                <Text style={styles.hint}>No aakna options listed for this gotra yet / इस गोत्र के लिए आकना सूची उपलब्ध नहीं</Text>
              )}
              <OptionPicker label="Mother Tongue / मातृभाषा" options={MOTHER_TONGUE_OPTIONS} value={motherTongue} onChange={setMotherTongue} compact />
              <OptionPicker label="Marital Status / वैवाहिक स्थिति" options={MARITAL_STATUS_OPTIONS} value={maritalStatus} onChange={setMaritalStatus} compact />
              <OptionPicker label="Manglik Status / मांगलिक" options={MANGLIK_OPTIONS} value={manglikStatus} onChange={setManglikStatus} compact />
              <OptionPicker label="Complexion / रंग" options={COMPLEXION_OPTIONS} value={complexion} onChange={setComplexion} compact />
              <OptionPicker label="Disability / विकलांगता" options={DISABILITY_OPTIONS} value={disability} onChange={setDisability} />
              <OptionPicker label="Blood Group / रक्त समूह" options={BLOOD_GROUP_OPTIONS} value={bloodGroup} onChange={setBloodGroup} compact />
              <OptionPicker label="Diet / आहार" options={DIETARY_HABIT_OPTIONS} value={dietaryHabit} onChange={setDietaryHabit} compact />

              <Text style={styles.label}>Date of Birth / जन्म तिथि</Text>
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="DD" placeholderTextColor="#8A7A60" keyboardType="numeric" value={dobDay} onChangeText={setDobDay} />
                <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="MM" placeholderTextColor="#8A7A60" keyboardType="numeric" value={dobMonth} onChangeText={setDobMonth} />
                <TextInput style={[styles.input, { flex: 2 }]} placeholder="YYYY" placeholderTextColor="#8A7A60" keyboardType="numeric" value={dobYear} onChangeText={setDobYear} />
              </View>

              <Text style={styles.label}>Time of Birth (optional) / जन्म समय</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.hint}>Hour / घंटा</Text>
                  <View style={styles.pickerRow}>
                    {BIRTH_HOURS.map((h) => (
                      <TouchableOpacity
                        key={`bh-${h}`}
                        style={[styles.smallRadio, birthHour === h ? styles.radioSelected : null]}
                        onPress={() => setBirthHour(h)}
                      >
                        <Text style={birthHour === h ? styles.radioTextSelected : styles.radioText}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hint}>Minute (0–59) / मिनट</Text>
                  <TextInput
                    style={styles.input}
                    value={String(birthMinute)}
                    keyboardType="numeric"
                    onChangeText={(v) => {
                      const n = Math.min(59, Math.max(0, Number(v) || 0));
                      setBirthMinute(n);
                    }}
                    placeholder="00"
                    placeholderTextColor="#8A7A60"
                  />
                </View>
              </View>
              <OptionPicker
                label="AM / PM"
                options={['AM', 'PM'] as const}
                value={birthAmPm}
                onChange={setBirthAmPm}
                compact
              />

              <Text style={styles.label}>Birth Location / जन्म स्थान</Text>
              <Text style={styles.hint}>Where you were born — can differ from present city / जहाँ आपका जन्म हुआ</Text>
              <Text style={styles.label}>Birth Country / जन्म देश</Text>
              <View style={styles.pickerRow}>
                {countriesList.map((c) => (
                  <TouchableOpacity
                    key={`birth-country-${c.id}`}
                    style={[styles.smallRadio, birthCountryId === c.id ? styles.radioSelected : null]}
                    onPress={() => handleBirthCountrySelect(c.id)}
                  >
                    <Text style={birthCountryId === c.id ? styles.radioTextSelected : styles.radioText}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {birthStatesList.length > 0 && (
                <>
                  <Text style={styles.label}>Birth State / जन्म राज्य</Text>
                  <View style={styles.pickerRow}>
                    {birthStatesList.map((s) => (
                      <TouchableOpacity
                        key={`birth-state-${s.id}`}
                        style={[styles.smallRadio, birthStateId === s.id ? styles.radioSelected : null]}
                        onPress={() => handleBirthStateSelect(s.id)}
                      >
                        <Text style={birthStateId === s.id ? styles.radioTextSelected : styles.radioText}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              {birthCitiesList.length > 0 && (
                <>
                  <Text style={styles.label}>Birth City / जन्म शहर</Text>
                  <View style={styles.pickerRow}>
                    {birthCitiesList.map((city) => (
                      <TouchableOpacity
                        key={`birth-${city.id}`}
                        style={[styles.smallRadio, birthCityId === city.id ? styles.radioSelected : null]}
                        onPress={() => setBirthCityId(city.id)}
                      >
                        <Text style={birthCityId === city.id ? styles.radioTextSelected : styles.radioText}>{city.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <OptionPicker
                label="Nakshatra / नक्षत्र"
                options={nakshatraOptions}
                value={nakshatra}
                onChange={setNakshatra}
                getDisplayLabel={(english) => nakshatraLabelByEnglish.get(english) ?? english}
                compact
              />
              <OptionPicker
                label="Zodiac (Rashi) / राशि"
                options={zodiacOptions}
                value={zodiac}
                onChange={setZodiac}
                getDisplayLabel={(english) => zodiacLabelByEnglish.get(english) ?? english}
                compact
              />

              <Text style={styles.label}>Height / ऊंचाई</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <OptionPicker label="Feet / फीट" options={HEIGHT_FT_OPTIONS} value={heightFt} onChange={setHeightFt} compact />
                </View>
                <View style={{ flex: 1 }}>
                  <OptionPicker label="Inches / इंच" options={HEIGHT_IN_OPTIONS} value={heightIn} onChange={setHeightIn} compact />
                </View>
              </View>
              <Text style={styles.label}>Weight (kg) / वजन</Text>
              <TextInput style={styles.input} value={weightKg} keyboardType="numeric" onChangeText={setWeightKg} />

              <Text style={styles.label}>Mobile / मोबाइल</Text>
              <TextInput style={styles.input} value={mobile} keyboardType="phone-pad" onChangeText={setMobile} placeholderTextColor="#8A7A60" />

              <Text style={styles.label}>WhatsApp / व्हाट्सएप</Text>
              <TextInput style={styles.input} value={whatsapp} keyboardType="phone-pad" onChangeText={setWhatsapp} placeholder="Same as mobile if blank" placeholderTextColor="#8A7A60" />

              <Text style={styles.label}>Present City / वर्तमान शहर</Text>
              <Text style={styles.hint}>Where you currently stay / जहाँ आप अभी रहते हैं</Text>
              <Text style={styles.label}>Country / देश</Text>
              <View style={styles.pickerRow}>
                {countriesList.map((c) => (
                  <TouchableOpacity
                    key={`living-country-${c.id}`}
                    style={[styles.smallRadio, livingCountryId === c.id ? styles.radioSelected : null]}
                    onPress={() => handleLivingCountrySelect(c.id)}
                  >
                    <Text style={livingCountryId === c.id ? styles.radioTextSelected : styles.radioText}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {livingStatesList.length > 0 && (
                <>
                  <Text style={styles.label}>State / राज्य</Text>
                  <View style={styles.pickerRow}>
                    {livingStatesList.map((s) => (
                      <TouchableOpacity
                        key={`living-state-${s.id}`}
                        style={[styles.smallRadio, livingStateId === s.id ? styles.radioSelected : null]}
                        onPress={() => handleLivingStateSelect(s.id)}
                      >
                        <Text style={livingStateId === s.id ? styles.radioTextSelected : styles.radioText}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              {livingCitiesList.length > 0 && (
                <>
                  <Text style={styles.label}>City / शहर</Text>
                  <View style={styles.pickerRow}>
                    {livingCitiesList.map((city) => (
                      <TouchableOpacity
                        key={city.id}
                        style={[styles.smallRadio, livingCityId === city.id ? styles.radioSelected : null]}
                        onPress={() => setLivingCityId(city.id)}
                      >
                        <Text style={livingCityId === city.id ? styles.radioTextSelected : styles.radioText}>{city.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.label}>Town / Area / इलाका</Text>
              <TextInput style={styles.input} value={town} onChangeText={setTown} placeholderTextColor="#8A7A60" />

              <Text style={styles.label}>Native State / मूल राज्य</Text>
              <TextInput style={styles.input} value={nativeState} onChangeText={setNativeState} placeholderTextColor="#8A7A60" />

              <Text style={styles.label}>About Me / मेरे बारे में</Text>
              <TextInput style={[styles.input, styles.textArea]} value={aboutMe} onChangeText={setAboutMe} multiline placeholderTextColor="#8A7A60" />

              {renderNavButtons(handleSaveStep1)}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.sectionHeader}>Education / शैक्षणिक योग्यता</Text>
              <OptionPicker label="Highest Degree / उच्चतम डिग्री" options={EDUCATION_DEGREE_OPTIONS} value={highestDegree} onChange={setHighestDegree} compact />
              <Text style={styles.label}>Field of Study / अध्ययन क्षेत्र</Text>
              <TextInput style={styles.input} value={fieldOfStudy} onChangeText={setFieldOfStudy} placeholderTextColor="#8A7A60" />
              <Text style={styles.label}>Institution / संस्थान</Text>
              <TextInput style={styles.input} value={institution} onChangeText={setInstitution} placeholderTextColor="#8A7A60" />
              <Text style={styles.label}>Completion Year / वर्ष</Text>
              <TextInput style={styles.input} value={completionYear} keyboardType="numeric" onChangeText={setCompletionYear} />
              <Text style={styles.label}>Educational Detail / शैक्षणिक विवरण</Text>
              <TextInput style={[styles.input, styles.textArea]} value={educationalDetail} onChangeText={setEducationalDetail} multiline placeholderTextColor="#8A7A60" />
              {renderNavButtons(handleSaveStep2, 1)}
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.sectionHeader}>Occupation / व्यवसाय</Text>
              <OptionPicker label="Occupation Type / प्रकार" options={OCCUPATION_TYPE_OPTIONS} value={occupationType} onChange={setOccupationType} compact />
              <Text style={styles.label}>Job Title / पद</Text>
              <TextInput style={styles.input} value={jobTitle} onChangeText={setJobTitle} placeholderTextColor="#8A7A60" />
              <Text style={styles.label}>Employer / संगठन</Text>
              <TextInput style={styles.input} value={employer} onChangeText={setEmployer} placeholderTextColor="#8A7A60" />
              <Text style={styles.label}>Occupation Detail / व्यवसाय विवरण</Text>
              <TextInput style={[styles.input, styles.textArea]} value={occupationDetail} onChangeText={setOccupationDetail} multiline placeholderTextColor="#8A7A60" />
              <Text style={styles.label}>Annual Income / वार्षिक आय</Text>
              <View style={styles.pickerRow}>
                {INCOME_RANGE_OPTIONS.map((range) => (
                  <TouchableOpacity
                    key={range.label}
                    style={[styles.smallRadio, incomeRangeLabel === range.label ? styles.radioSelected : null]}
                    onPress={() => setIncomeRangeLabel(range.label)}
                  >
                    <Text style={incomeRangeLabel === range.label ? styles.radioTextSelected : styles.radioText}>₹ {range.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {renderNavButtons(handleSaveStep3, 2)}
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.sectionHeader}>Family / पारिवारिक पृष्ठभूमि</Text>
              <Text style={styles.label}>Father's Name / पिता का नाम</Text>
              <TextInput style={styles.input} value={fatherName} onChangeText={setFatherName} />
              <Text style={styles.label}>Parent's Contact Number / अभिभावक का संपर्क</Text>
              <TextInput style={styles.input} value={parentMobile} keyboardType="phone-pad" onChangeText={setParentMobile} />
              <Text style={styles.label}>Father's Occupation / पिता का व्यवसाय</Text>
              <TextInput style={styles.input} value={fatherOccupation} onChangeText={setFatherOccupation} />
              <Text style={styles.label}>Mother's Name / माता का नाम</Text>
              <TextInput style={styles.input} value={motherName} onChangeText={setMotherName} />
              <Text style={styles.label}>Mother's Occupation / माता का व्यवसाय</Text>
              <TextInput style={styles.input} value={motherOccupation} onChangeText={setMotherOccupation} />

              <Text style={styles.label}>Brothers (Married / Unmarried) / भाई</Text>
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} value={marriedBrothers} keyboardType="numeric" onChangeText={setMarriedBrothers} placeholder="Married" placeholderTextColor="#8A7A60" />
                <TextInput style={[styles.input, { flex: 1 }]} value={unmarriedBrothers} keyboardType="numeric" onChangeText={setUnmarriedBrothers} placeholder="Unmarried" placeholderTextColor="#8A7A60" />
              </View>

              <Text style={styles.label}>Sisters (Married / Unmarried) / बहन</Text>
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} value={marriedSisters} keyboardType="numeric" onChangeText={setMarriedSisters} placeholder="Married" placeholderTextColor="#8A7A60" />
                <TextInput style={[styles.input, { flex: 1 }]} value={unmarriedSisters} keyboardType="numeric" onChangeText={setUnmarriedSisters} placeholder="Unmarried" placeholderTextColor="#8A7A60" />
              </View>

              <Text style={styles.label}>Maternal Uncle (Mama) Name / मामा का नाम</Text>
              <TextInput style={styles.input} value={maternalUncleName} onChangeText={setMaternalUncleName} />
              <Text style={styles.label}>Maternal Uncle Aakna / मामा का आकना</Text>
              <Text style={styles.hint}>Gahoi Samaj master list / गहोई समाज आकना सूची</Text>
              <TextInput
                style={styles.input}
                value={maternalAaknaSearch}
                onChangeText={setMaternalAaknaSearch}
                placeholder="Search aakna / आकना खोजें"
                placeholderTextColor="#8A7A60"
              />
              <ScrollView style={styles.aaknaPickerScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                <View style={styles.pickerRow}>
                  {filteredMaternalAaknas.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.smallRadio, maternalUncleAaknaId === a.id ? styles.radioSelected : null]}
                      onPress={() => setMaternalUncleAaknaId(a.id)}
                    >
                      <Text style={maternalUncleAaknaId === a.id ? styles.radioTextSelected : styles.radioText}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <OptionPicker label="Family Type / परिवार प्रकार" options={FAMILY_TYPE_OPTIONS} value={familyType} onChange={setFamilyType} />
              <OptionPicker label="Family Status / पारिवारिक स्थिति" options={FAMILY_STATUS_OPTIONS} value={familyStatus} onChange={setFamilyStatus} compact />
              <OptionPicker label="House / घर" options={HAS_HOUSE_OPTIONS} value={hasHouse} onChange={setHasHouse} compact />

              <View style={[styles.row, { alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 }]}>
                <Text style={styles.labelInline}>Has Car / कार है</Text>
                <Switch value={hasCar} onValueChange={setHasCar} trackColor={{ false: '#FFFFFF', true: '#B5620E' }} thumbColor={hasCar ? '#FFFFFF' : '#8A7A60'} />
              </View>

              <Text style={styles.label}>Present Address / वर्तमान पता</Text>
              <TextInput style={[styles.input, styles.textArea]} value={homeAddress} onChangeText={setHomeAddress} multiline />
              <Text style={styles.label}>Permanent Address / स्थायी पता</Text>
              <TextInput style={[styles.input, styles.textArea]} value={permanentAddress} onChangeText={setPermanentAddress} multiline />

              {renderNavButtons(handleSaveStep4, 3)}
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={styles.sectionHeader}>Partner Preferences / जीवनसाथी की पसंद</Text>

              <Text style={styles.label}>Partner Age Range / उम्र सीमा</Text>
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} keyboardType="numeric" value={prefAgeMin} onChangeText={setPrefAgeMin} placeholder="Min" placeholderTextColor="#8A7A60" />
                <TextInput style={[styles.input, { flex: 1 }]} keyboardType="numeric" value={prefAgeMax} onChangeText={setPrefAgeMax} placeholder="Max" placeholderTextColor="#8A7A60" />
              </View>

              <Text style={styles.label}>Partner Height Min / न्यूनतम ऊंचाई</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <OptionPicker label="Feet" options={HEIGHT_FT_OPTIONS} value={prefHeightMinFt} onChange={setPrefHeightMinFt} compact />
                </View>
                <View style={{ flex: 1 }}>
                  <OptionPicker label="Inches" options={HEIGHT_IN_OPTIONS} value={prefHeightMinIn} onChange={setPrefHeightMinIn} compact />
                </View>
              </View>
              <Text style={styles.label}>Partner Height Max / अधिकतम ऊंचाई</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <OptionPicker label="Feet" options={HEIGHT_FT_OPTIONS} value={prefHeightMaxFt} onChange={setPrefHeightMaxFt} compact />
                </View>
                <View style={{ flex: 1 }}>
                  <OptionPicker label="Inches" options={HEIGHT_IN_OPTIONS} value={prefHeightMaxIn} onChange={setPrefHeightMaxIn} compact />
                </View>
              </View>

              <Text style={styles.label}>Partner Marital Status / वैवाहिक स्थिति</Text>
              <View style={styles.pickerRow}>
                {MARITAL_STATUS_OPTIONS.map((ms) => (
                  <TouchableOpacity
                    key={ms}
                    style={[styles.smallRadio, prefMaritalStatus.includes(ms) ? styles.radioSelected : null]}
                    onPress={() => togglePrefMarital(ms)}
                  >
                    <Text style={prefMaritalStatus.includes(ms) ? styles.radioTextSelected : styles.radioText}>{ms}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <OptionPicker label="Minimum Education / न्यूनतम शिक्षा" options={EDUCATION_DEGREE_OPTIONS} value={prefEducationMin} onChange={setPrefEducationMin} compact />
              <Text style={styles.label}>Minimum Income (₹) / न्यूनतम आय</Text>
              <TextInput style={styles.input} value={prefIncomeMin} keyboardType="numeric" onChangeText={setPrefIncomeMin} />
              <OptionPicker label="Manglik Preference / मांगलिक पसंद" options={MANGLIK_PREFERENCE_OPTIONS} value={prefManglik} onChange={setPrefManglik} />

              <View style={[styles.row, { alignItems: 'center', justifyContent: 'space-between', marginVertical: 16 }]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.labelInline}>Exclude Same Gotra / समान गोत्र निषेध</Text>
                </View>
                <Switch value={excludeSameGotra} onValueChange={setExcludeSameGotra} trackColor={{ false: '#FFFFFF', true: '#B5620E' }} thumbColor={excludeSameGotra ? '#FFFFFF' : '#8A7A60'} />
              </View>

              <View style={[styles.row, { alignItems: 'center', justifyContent: 'space-between', marginVertical: 16 }]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.labelInline}>I accept the terms & privacy policy / मैं नियम स्वीकार करता/करती हूँ</Text>
                </View>
                <Switch value={termsAccepted} onValueChange={setTermsAccepted} trackColor={{ false: '#FFFFFF', true: '#B5620E' }} thumbColor={termsAccepted ? '#FFFFFF' : '#8A7A60'} />
              </View>

              {renderNavButtons(handleSaveStep5, 4)}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFAF5' },
  loadingContainer: { flex: 1, backgroundColor: '#FDFAF5', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#3D2E1A', marginTop: 16, fontSize: 15 },
  progressBar: { flexDirection: 'row', height: 4, backgroundColor: '#FFFFFF', width: '100%' },
  progressSegment: { flex: 1, height: '100%' },
  progressActive: { backgroundColor: '#B5620E' },
  progressInactive: { backgroundColor: '#FFFFFF' },
  scrollContainer: { flexGrow: 1, padding: 24, paddingBottom: 48 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  stepTitle: { color: '#B5620E', fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
  wrongAccount: { fontSize: 12, color: '#8A7A60', textDecorationLine: 'underline' },
  sectionHeader: { color: '#3D2E1A', fontSize: 22, fontWeight: '800', marginBottom: 24 },
  label: { color: '#3D2E1A', fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  labelInline: { color: '#3D2E1A', fontSize: 15, fontWeight: '600' },
  hint: { color: '#8A7A60', fontSize: 12, marginBottom: 8, marginTop: -4 },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#3D2E1A',
    borderWidth: 1,
    borderColor: '#E8E0D0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', marginTop: 4 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  aaknaPickerScroll: { maxHeight: 160, marginBottom: 8 },
  smallRadio: {
    borderWidth: 1,
    borderColor: '#E8E0D0',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  radioSelected: { borderColor: '#B5620E', backgroundColor: '#B5620E' },
  radioText: { color: '#3D2E1A', fontWeight: '500', fontSize: 13 },
  radioTextSelected: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  nextButton: {
    backgroundColor: '#B5620E',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  nextText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
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
  backStepText: { color: '#8A7A60', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#C0392B', fontSize: 14, marginVertical: 12, fontWeight: '500' },
  errorBanner: { backgroundColor: '#FEF0F0', borderWidth: 1, borderColor: '#F0A0A0', borderRadius: 8, padding: 12, marginBottom: 8 },
  errorBannerText: { color: '#C0392B', fontSize: 13, fontWeight: '500' },
});
