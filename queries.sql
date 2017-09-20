SELECT service_id from calendar_dates where date='20170920'   -- 216 servizi

-- corse della linea 127 (direzione 0) di oggi  (trip_id è XXX_<codicecorsamaior>)
select t.* from trips t where t.route_id='F127' and direction_id='0' and t.service_id in (SELECT service_id from calendar_dates where date='20170920' )

-- dettaglio di una corsa
select st.stop_sequence, st.trip_id, st.departure_time, s.stop_name, s.stop_lat, s.stop_lon
from stop_times st 
join stops s on st.stop_id=s.stop_id
where st.trip_id='454_695642' order by st.departure_time 