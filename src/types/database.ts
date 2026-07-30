export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          nickname?: string | null
          avatar_url?: string | null
          bio?: string | null
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
          deleted_at: string | null
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
	      work_plans: {
	        Row: {
	          id: string
	          user_id: string
	          work_date: string
	          title: string
	          period: string
	          content: string | null
	          category: string
	          created_at: string
	          updated_at: string
	          deleted_at: string | null
	        }
	        Insert: {
	          id?: string
	          user_id: string
	          work_date?: string
	          title: string
	          period?: string
	          content?: string | null
	          category?: string
	          created_at?: string
	          updated_at?: string
	        }
	        Update: {
	          work_date?: string
	          title?: string
	          period?: string
	          content?: string | null
	          category?: string
	          updated_at?: string
	        }
	      }
	      schedules: {
	        Row: {
	          id: string
	          user_id: string
	          course_name: string
	          class_name: string
	          day_of_week: number
	          start_time: string
	          end_time: string
	          location: string | null
	          notes: string | null
	          created_at: string
	          updated_at: string
	        }
	        Insert: {
	          id?: string
	          user_id: string
	          course_name: string
	          class_name?: string
	          day_of_week: number
	          start_time: string
	          end_time: string
	          location?: string | null
	          notes?: string | null
	          created_at?: string
	          updated_at?: string
	        }
	        Update: {
	          course_name?: string
	          class_name?: string
	          day_of_week?: number
	          start_time?: string
	          end_time?: string
	          location?: string | null
	          notes?: string | null
	          updated_at?: string
	        }
	      }
	      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          category: string
          description: string | null
          expense_date: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          type?: string
          user_id: string
          amount: number
          category?: string
          description?: string | null
          expense_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: string
          amount?: number
          category?: string
          description?: string | null
          expense_date?: string
          updated_at?: string
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
          deleted_at: string | null
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
      locations: {
        Row: {
          id: string
          user_id: string
          name: string
          location_type: string
          description: string | null
          address: string | null
          visit_date: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          location_type?: string
          description?: string | null
          address?: string | null
          visit_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          location_type?: string
          description?: string | null
          address?: string | null
          visit_date?: string
          updated_at?: string
        }
      }
      photo_records: {
        Row: {
          id: string
          user_id: string
          storage_path: string
          title: string | null
          description: string | null
          photo_date: string
          location_id: string | null
          category: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          storage_path: string
          title?: string | null
          description?: string | null
          photo_date?: string
          location_id?: string | null
          category?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          storage_path?: string
          title?: string | null
          description?: string | null
          photo_date?: string
          location_id?: string | null
          category?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          color?: string
          updated_at?: string
        }
      }
      diary_tags: {
        Row: {
          id: string
          diary_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          diary_id: string
          tag_id: string
        }
        Update: {
          diary_id?: string
          tag_id?: string
        }
      }
      photo_tags: {
        Row: {
          id: string
          photo_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          photo_id: string
          tag_id: string
        }
        Update: {
          photo_id?: string
          tag_id?: string
        }
      }
      location_tags: {
        Row: {
          id: string
          location_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          location_id: string
          tag_id: string
        }
        Update: {
          location_id?: string
          tag_id?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string
          name: string
          class_name: string
          role: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          class_name?: string
          role?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          class_name?: string
          role?: string | null
          notes?: string | null
          updated_at?: string
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
      },
      assets: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          amount?: number
          sort_order?: number
          updated_at?: string
        }
      },
      welfare_items: {
        Row: {
          id: string
          user_id: string
          title: string
          category: string
          description: string | null
          value_estimate: number
          received_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category?: string
          description?: string | null
          value_estimate?: number
          received_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          category?: string
          description?: string | null
          value_estimate?: number
          received_date?: string
          updated_at?: string
        }
        }

    }
  }
}
