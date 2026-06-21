export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string | null
          email: string | null
          date_of_birth: string | null
          gender: string | null
          address: string | null
          medical_history: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          date_time: string
          duration: number
          type: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      treatments: {
        Row: {
          id: string
          patient_id: string
          tooth_number: number | null
          treatment_type: string
          description: string | null
          status: string
          cost: number
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['treatments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['treatments']['Insert']>
      }
      prescriptions: {
        Row: {
          id: string
          patient_id: string
          medications: Json
          diagnosis: string | null
          notes: string | null
          prescribed_date: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          patient_id: string
          items: Json
          total_amount: number
          paid_amount: number
          status: string
          due_date: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      dental_records: {
        Row: {
          id: string
          patient_id: string
          tooth_number: number
          condition: string
          notes: string | null
          recorded_date: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['dental_records']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['dental_records']['Insert']>
      }
    }
  }
}
