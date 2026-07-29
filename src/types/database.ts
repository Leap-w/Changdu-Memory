export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          nickname?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      time_profile: {
        Row: {
          id: string
          user_id: string
          project_name: string | null
          location: string | null
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_name?: string | null
          location?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          project_name?: string | null
          location?: string | null
          start_date?: string | null
          end_date?: string | null
          updated_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          todo_date: string
          priority: string
          category: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          todo_date?: string
          priority?: string
          category?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          todo_date?: string
          priority?: string
          category?: string
          completed?: boolean
          updated_at?: string
        }
      }
      work_items: {
        Row: {
          id: string
          user_id: string
          date: string
          title: string
          description: string | null
          category: string | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          title: string
          description?: string | null
          category?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          date?: string
          title?: string
          description?: string | null
          category?: string | null
          completed?: boolean
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string | null
          remark: string | null
          expense_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          category?: string | null
          remark?: string | null
          expense_date: string
          created_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          remark?: string | null
          expense_date?: string
        }
      }
      diaries: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string | null
          diary_date: string
          weather: string | null
          mood: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content?: string | null
          diary_date: string
          weather?: string | null
          mood?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string | null
          content?: string | null
          diary_date?: string
          weather?: string | null
          mood?: string | null
          updated_at?: string
        }
      }
      diary_photos: {
        Row: {
          id: string
          diary_id: string
          storage_path: string
          image_url: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          diary_id: string
          storage_path: string
          image_url: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          storage_path?: string
          image_url?: string
          sort_order?: number
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          category: string | null
          title: string
          content: string | null
          remark: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category?: string | null
          title: string
          content?: string | null
          remark?: string | null
        }
        Update: {
          category?: string | null
          title?: string
          content?: string | null
          remark?: string | null
        }
      }
      settings: {
        Row: {
          id: string
          user_id: string
          theme: string | null
          language: string | null
          sync_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string | null
          language?: string | null
          sync_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          theme?: string | null
          language?: string | null
          sync_enabled?: boolean
          updated_at?: string
        }
      }
    }
  }
}
