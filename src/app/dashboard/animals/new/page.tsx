'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { mockStorage } from '@/lib/mockStorage';

interface AnimalFormData {
  enar: string;
  szuletesi_datum: string;
  ivar: 'hímivar' | 'nőivar';
  anya_enar: string;
  apa_enar: string;
  kplsz: string;
  bekerules_datum: string;
  jelenlegi_karam: string;
  statusz: 'aktív' | 'selejtezés' | 'elhullott' | 'kikerült' | 'eladott' | 'házi vágás';
}

// Kategória automatikus kalkuláció születési dátum és ivar alapján
const calculateCategory = (birthDate: string, gender: string): string => {
  const birth = new Date(birthDate);
  const now = new Date();
  const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());

  if (ageInMonths < 6) return 'növarú_borjú';
  
  if (gender === 'hímivar') {
    if (ageInMonths >= 24) return 'tenyészbika';
    return 'hízóbika';
  } else {
    if (
