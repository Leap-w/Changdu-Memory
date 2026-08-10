export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          bio: string | null
          school: string | null
          subject: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          bio?: string | null
          school?: string | null
          subject?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          nickname?: string | null
          avatar_url?: string | null
          bio?: string | null
          school?: string | null
          subject?: string | null
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
          deadline_date: string | null
          deadline_time: string | null
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
          deadline_date?: string | null
          deadline_time?: string | null
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
          deadline_date?: string | null
          deadline_time?: string | null
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
	          start_time: string | null
	          end_time: string | null
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
	          start_time?: string | null
	          end_time?: string | null
	          created_at?: string
	          updated_at?: string
	        }
	        Update: {
	          work_date?: string
	          title?: string
	          period?: string
	          content?: string | null
	          category?: string
	          start_time?: string | null
	          end_time?: string | null
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
      memories: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          event_date: string
          category: string
          location: string | null
          image_urls: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string | null
          event_date: string
          category?: string
          location?: string | null
          image_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          content?: string | null
          event_date?: string
          category?: string
          location?: string | null
          image_urls?: string[] | null
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
      countdowns: {
        Row: {
          id: string
          user_id: string
          title: string
          start_date: string | null
          end_date: string
          pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          start_date?: string | null
          end_date: string
          pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          start_date?: string | null
          end_date?: string
          pinned?: boolean
          updated_at?: string
        }
      }
      memory_photos: {
        Row: {
          id: string
          memory_id: string
          storage_path: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          storage_path: string
          url: string
          created_at?: string
        }
        Update: {
          storage_path?: string
          url?: string
        }
      }
      journey_milestones: {
        Row: {
          id: string
          user_id: string
          label: string
          description: string | null
          start_date: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          description?: string | null
          start_date?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          label?: string
          description?: string | null
          start_date?: string | null
          sort_order?: number
          updated_at?: string
        }
      }
      moods: {
        Row: {
          id: string
          user_id: string
          label: string
          emoji: string
          note: string | null
          mood_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          emoji?: string
          note?: string | null
          mood_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          label?: string
          emoji?: string
          note?: string | null
          mood_date?: string
          updated_at?: string
        }
      }
      mood_options: {
        Row: {
          id: string
          user_id: string
          label: string
          emoji: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          emoji?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          label?: string
          emoji?: string
          sort_order?: number
          updated_at?: string
        }
      }

    }
  }
}
