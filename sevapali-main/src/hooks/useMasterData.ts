import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type State = Database['public']['Tables']['states']['Row'];
type District = Database['public']['Tables']['districts']['Row'];
type City = Database['public']['Tables']['cities']['Row'];
type Office = Database['public']['Tables']['offices']['Row'];
type Service = Database['public']['Tables']['services']['Row'];

export const useStates = () => {
    return useQuery({
        queryKey: ['states'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('states')
                .select('*')
                .in('state_name', ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana']) // Filter for Demo
                .order('state_name');
            return data;
        },
    });
};

export const useDistricts = (stateId: string | undefined) => {
    return useQuery({
        queryKey: ['districts', stateId],
        queryFn: async () => {
            if (!stateId) return [];
            const { data, error } = await supabase
                .from('districts')
                .select('*')
                .eq('state_id', stateId)
                .order('district_name');
            if (error) throw error;
            return data;
        },
        enabled: !!stateId,
    });
};

export const useCities = (districtId: string | undefined) => {
    return useQuery({
        queryKey: ['cities', districtId],
        queryFn: async () => {
            if (!districtId) return [];
            const { data, error } = await supabase
                .from('cities')
                .select('*')
                .eq('district_id', districtId)
                .order('city_name');
            if (error) throw error;
            return data;
        },
        enabled: !!districtId,
    });
};

// Departments
export const useDepartments = () => {
    return useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('departments')
                .select('*')
                .order('name');
            if (error) throw error;
            return data;
        },
    });
};

// Counters
export const useCounters = (officeId: string | undefined) => {
    return useQuery({
        queryKey: ['counters', officeId],
        queryFn: async () => {
            if (!officeId) return [];
            const { data, error } = await supabase
                .from('counters')
                .select('*')
                .eq('office_id', officeId)
                .order('code');
            if (error) throw error;
            return data;
        },
        enabled: !!officeId,
    });
};

export const useOfficesByCity = (cityId: string | undefined, departmentId?: string) => {
    return useQuery({
        queryKey: ['offices', cityId, departmentId],
        queryFn: async () => {
            if (!cityId) return [];
            let query = supabase
                .from('offices')
                .select('*')
                .eq('city_id', cityId);

            if (departmentId) {
                query = query.eq('department_id', departmentId);
            }

            const { data, error } = await query.order('office_name');
            if (error) throw error;
            return data;
        },
        enabled: !!cityId,
    });
};

// Keep this for backward compatibility or direct district lookup if needed
export const useOfficesByDistrict = (districtId: string | undefined, departmentId?: string) => {
    return useQuery({
        queryKey: ['offices-district', districtId, departmentId],
        queryFn: async () => {
            if (!districtId) return [];
            let query = supabase
                .from('offices')
                .select('*')
                .eq('district_id', districtId);

            if (departmentId) {
                query = query.eq('department_id', departmentId);
            }

            const { data, error } = await query.order('office_name');
            if (error) throw error;
            return data;
        },
        enabled: !!districtId,
    });
};

export const useServices = (officeId?: string, departmentId?: string) => {
    return useQuery({
        queryKey: ['services', officeId, departmentId],
        queryFn: async () => {
            let query = supabase
                .from('services')
                .select('*');

            // If officeId provided, try to filter by its department (legacy/specific)
            if (officeId && !departmentId) {
                const { data: office } = await supabase
                    .from('offices')
                    .select('department_id')
                    .eq('id', officeId)
                    .single();
                if (office?.department_id) {
                    query = query.eq('department_id', office.department_id);
                }
            }
            // If departmentId explicitly provided (new flow)
            else if (departmentId) {
                query = query.eq('department_id', departmentId);
            }

            const { data, error } = await query.order('service_name');
            if (error) throw error;
            return data;
        },
        enabled: true
    });
};

// For fetching a specific office details
export const useOffice = (officeId: string | undefined) => {
    return useQuery({
        queryKey: ['office', officeId],
        queryFn: async () => {
            if (!officeId) return null;
            const { data, error } = await supabase
                .from('offices')
                .select('*, departments(name)') // Join department name
                .eq('id', officeId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!officeId,
    });
};
