import SurveyDocuments from "../../../components/SurveyDocuments";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography, Checkbox, FormControlLabel, CircularProgress, IconButton } from '@mui/material';
import { Add, ArrowBack, CallOutlined, DownloadOutlined, Refresh, RouteOutlined, UploadFileOutlined, DeleteOutlineOutlined as DeleteOutline } from '@mui/icons-material';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
const date = v => String(v || '').slice(0, 10),
  time = v => {
    const m = String(v || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    return m ? String(Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0)).padStart(2, '0') + ':' + m[2] : String(v || '').slice(0, 5);
  };
const cardSx = {
  p: {
    xs: 2,
    sm: 3
  },
  borderRadius: 3,
  border: '1px solid #E2E8F0',
  minWidth: 0
};
const statusColor = s => s === 'Approved' || s === 'Completed' ? 'success' : s === 'Blocked' || s === 'Returned' ? 'error' : s === 'Submitted' ? 'warning' : 'default';
const Contact = ({
  row
}) => <Stack direction="row" useFlexGap sx={{
  gap: 1,
  flexWrap: 'wrap'
}}>{row.landmark && <Typography variant="body2" sx={{width:'100%',overflowWrap:'anywhere'}}>Landmark: {row.landmark}</Typography>}{row.site_latitude != null && row.site_longitude != null && <Typography variant="caption" sx={{width:'100%'}}>Site GPS: {row.site_latitude}, {row.site_longitude}</Typography>}{row.customer_phone && <Button size="small" startIcon={<CallOutlined />} component="a" href={'tel:' + String(row.customer_phone).replace(/[^+0-9]/g, '')}>Call customer</Button>}{(row.customer_address || row.city) && <Button size="small" startIcon={<RouteOutlined />} component="a" href={'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(row.site_latitude != null && row.site_longitude != null ? `${row.site_latitude},${row.site_longitude}` : [row.customer_address, row.city, row.state].filter(Boolean).join(', '))} target="_blank" rel="noopener noreferrer">Navigate to site</Button>}</Stack>;
export default function FieldWorkspace({
  mode = 'dashboard',
  resourceType
}) {
  const {
      id
    } = useParams(),
    location = useLocation(),
    navigate = useNavigate(),
    {
      user
    } = useAuth();
  const coordinator = [1, 2].includes(Number(user?.role_id));
  const [data, setData] = useState(null),
    [detail, setDetail] = useState(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [kind, setKind] = useState('all'),
    [dialog, setDialog] = useState(null),
    [engineers, setEngineers] = useState([]);
  const filter = new URLSearchParams(location.search).get('filter') || 'all';
  const setFilter = value => {
    const params = new URLSearchParams(location.search);
    if (value === 'all') params.delete('filter');else params.set('filter', value);
    navigate({
      pathname: location.pathname,
      search: params.toString()
    }, {
      replace: true
    });
  };
  const requestSequence = useRef(0);
  const viewingResource = Boolean(resourceType && id);
  const invalidateRequest = useCallback(() => {
    requestSequence.current++;
  }, []);
  const fieldHome = Number(user?.role_id) === 2 ? '/manager/field-work' : Number(user?.role_id) === 1 ? '/field-work' : '/engineer';
  const base = Number(user?.role_id) === 2 ? '/manager/projects' : Number(user?.role_id) === 1 ? '/projects' : '/engineer/projects';
  const load = useCallback(async () => {
    const request = ++requestSequence.current;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/field-work/workspace', {
        params: {
          search,
          page,
          survey_filter: mode === 'surveys' ? filter : 'all'
        }
      });
      if (request !== requestSequence.current) return;
      setData(res.data.data);
      if (resourceType && id) {
        const r = await api.get(`/field-work/resources/${resourceType}/${id}`);
        if (request !== requestSequence.current) return;
        setDetail({
          ...r.data.data,
          resourceKey: `${resourceType}:${id}`
        });
      }
    } catch (e) {
      if (request === requestSequence.current) setError(e.response?.data?.message || 'Assigned work could not be loaded.');
    } finally {
      if (request === requestSequence.current) setLoading(false);
    }
  }, [id, page, resourceType, search, mode, filter]);
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => {
      clearTimeout(timer);
      invalidateRequest();
    };
  }, [load, invalidateRequest]);
  useEffect(() => {
    if (coordinator) api.get('/field-work/engineers').then(r => setEngineers(r.data.data)).catch(() => {});
  }, [coordinator]);
  const resource = detail?.resourceKey === `${resourceType}:${id}` ? detail.resource : null,
    type = resourceType || 'project';
  const openResource = (t, rid) => navigate(t === 'survey' ? `${fieldHome}/surveys/${rid}` : coordinator ? `${base}/${rid}` : `/engineer/projects/${rid}`);
  const refresh = () => {
    setDialog(null);
    load();
  };
  const download = async file => {
    try {
      const r = await api.get(`/field-work/files/${file.id}`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(r.data),
        a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error('File could not be downloaded.');
    }
  };
  const tasks = (resource ? detail.tasks : data?.tasks || []).filter(t => (mode !== 'service' || ['Service', 'AMC'].includes(t.kind)) && (filter === 'all' || (filter === 'overdue' ? !['Completed', 'Cancelled', 'Submitted'].includes(t.status) && (date(t.due_date) < data.local_date || date(t.due_date) === data.local_date && time(t.due_time) < data.local_time) : t.status === filter)) && (!search || [t.title, t.customer_name].some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))));
  const listMode = ['projects', 'surveys'].includes(mode),
    definitions = detail?.definitions || data?.definitions || {};
  return <Box sx={{
    minWidth: 0,
    width: '100%',
    '& .MuiButton-root': {
      whiteSpace: 'normal',
      height: 'auto',
      minHeight: {xs:44,sm:36}
    },
    '& .MuiTypography-root': {
      overflowWrap: 'anywhere'
    },
    '& .MuiStack-root': {
      minWidth: 0
    }
  }}>
 <Paper elevation={0} sx={{
      ...cardSx,
      mb: 2.5
    }}><Stack direction={{
        xs: 'column',
        sm: 'row'
      }} useFlexGap sx={{
        gap: 2,
        justifyContent: 'space-between',
        alignItems: {
          sm: 'center'
        }
      }}><Box><Typography variant="h5" fontWeight={800}>{resource ? resource.customer_name : mode === 'surveys' ? 'Site surveys' : mode === 'projects' ? 'Assigned projects' : mode === 'service' ? 'Service & AMC visits' : mode === 'tasks' ? coordinator ? 'Field team tasks & reviews' : 'My tasks & blockers' : 'Field work dashboard'}</Typography><Typography color="text.secondary" variant="body2" sx={{
            mt: .5
          }}>{resource ? `${type === 'project' ? resource.project_number : 'Survey #' + resource.id} • ${resource.system_capacity_kw || 'Capacity not recorded'} kW` : 'Assigned work, site evidence and clear next actions.'}</Typography>{resource && <Typography variant="body2" color="text.secondary" sx={{
            mt: .5,
            overflowWrap: 'anywhere'
          }}>{[resource.customer_address, resource.city, resource.state].filter(Boolean).join(', ')}</Typography>}</Box><Stack direction="row" useFlexGap sx={{
          gap: 1,
          flexWrap: 'wrap'
        }}>{resource && <Button startIcon={<ArrowBack />} onClick={() => navigate(coordinator ? type === 'survey' ? fieldHome + '/surveys' : base : type === 'survey' ? '/engineer/surveys' : '/engineer/projects')}>Back</Button>}<Button startIcon={<Refresh />} onClick={load}>Refresh</Button>{resource && coordinator && <Button variant="outlined" onClick={() => setDialog({
            type: 'assignment'
          })}>Assign engineer</Button>}</Stack></Stack>{resource && <Box sx={{
        mt: 1.5
      }}><Contact row={resource} /></Box>}</Paper>
 {resource && type === 'survey' && <Box sx={{ mb: 2 }}><SurveyDocuments surveyId={resource.id} /></Box>}
 {error && <Alert severity="error" sx={{
      mb: 2
    }}>{error}</Alert>}
 {loading && !data ? <Box sx={{
      p: 4,
      textAlign: 'center'
    }}><CircularProgress size={28} /></Box> : data && <>
 {!resource && !viewingResource && <>
 {mode === 'dashboard' && <><Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr 1fr',
              lg: 'repeat(3,1fr)'
            },
            gap: 2,
            mb: 2.5
          }}>{[['Assigned projects', data.total_projects, `${fieldHome}/projects`, '#0284C7'], ["Today's surveys", Number(data.stats?.today_surveys || 0), `${fieldHome}/surveys?filter=today`, '#D97706'], ['Open tasks', Number(data.task_stats?.open_tasks || 0), `${fieldHome}/tasks`, '#7C3AED'], ['Blocked tasks', Number(data.task_stats?.blocked_tasks || 0), `${fieldHome}/tasks?filter=Blocked`, '#DC2626'], ['Overdue tasks', Number(data.task_stats?.overdue_tasks || 0), `${fieldHome}/tasks?filter=overdue`, '#D97706'], ['Awaiting review', Number(data.pending_review_count || 0), `${fieldHome}/tasks?filter=Submitted`, '#0284C7']].map(([label, value, link, color]) => <Card key={label} variant="outlined" onClick={() => navigate(link)} sx={{
              p: 2.5,
              borderRadius: 3,
              cursor: 'pointer',
              borderColor: '#E2E8F0'
            }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={800} sx={{
                color,
                mt: 1
              }}>{value}</Typography></Card>)}</Box><Alert severity="info" sx={{
            mb: 2
          }}>Work submission, coordinator approval and DISCOM permission are separate. Scheduling timezone: {data.timezone}.</Alert></>}
 <Paper elevation={0} sx={{
          ...cardSx,
          mb: 2
        }}><Stack direction={{
            xs: 'column',
            sm: 'row'
          }} useFlexGap sx={{
            gap: 2
          }}><TextField fullWidth size="small" label="Search assignments" value={search} onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }} />{mode === 'surveys' ? <TextField select size="small" label="Visit status" value={filter} onChange={e => setFilter(e.target.value)} sx={{
              minWidth: 180
            }}>{[['all', 'All surveys'], ['today', 'Today'], ['scheduled', 'Scheduled'], ['completed', 'Completed'], ['overdue', 'Overdue']].map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField> : !listMode && <TextField select size="small" label="Task status" value={filter} onChange={e => setFilter(e.target.value)} sx={{
              minWidth: 180
            }}>{['all', 'overdue', 'Open', 'In progress', 'Blocked', 'Submitted', 'Completed', 'Cancelled'].map(v => <MenuItem key={v} value={v}>{v === 'all' ? 'All tasks' : v === 'overdue' ? 'Overdue' : v}</MenuItem>)}</TextField>}</Stack></Paper>
 {(listMode || mode === 'dashboard') && <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '1fr 1fr'
          },
          gap: 2,
          mb: 2
        }}>{(mode === 'surveys' ? data.surveys : mode === 'projects' ? data.projects : [...(data.today_surveys || data.surveys.filter(s => date(s.scheduled_date) === data.local_date && s.status === 'scheduled')), ...data.projects.slice(0, 4)]).filter(row => mode !== 'surveys' || filter === 'all' || (filter === 'today' ? date(row.scheduled_date) === data.local_date : filter === 'overdue' ? row.status === 'scheduled' && date(row.scheduled_date) < data.local_date : row.status === filter)).map(row => <Paper key={(row.project_number ? 'p' : 's') + row.id} elevation={0} sx={cardSx}><Stack direction="row" useFlexGap sx={{
              gap: 1,
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1
            }}><Typography fontWeight={800} sx={{
                overflowWrap: 'anywhere'
              }}>{row.customer_name}</Typography><Stack direction="row" spacing={0.5} alignItems="center">{row.is_approved ? <Chip size="small" color="success" label={row.project_number ? `Approved (${row.project_number})` : 'Approved'} /> : row.status === 'completed' ? <Chip size="small" color="warning" label="Awaiting Approval" /> : <Chip size="small" label={row.stage || row.status} />}</Stack></Stack><Typography variant="body2" color="text.secondary">{row.project_number || row.lead_code || 'Survey #' + row.id}</Typography>{row.scheduled_date && <Typography variant="body2" sx={{
              mt: 1
            }}>{date(row.scheduled_date)} • {time(row.scheduled_time)}</Typography>}<Typography variant="body2" sx={{
              my: 1,
              overflowWrap: 'anywhere'
            }}>{[row.customer_address, row.city].filter(Boolean).join(', ') || 'Address not recorded'}</Typography><Contact row={row} /><Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap"><Button variant="contained" onClick={() => openResource(row.project_number ? 'project' : 'survey', row.id)}>{row.project_number ? 'Open project management' : 'Open field workspace'}</Button>{row.project_id && !row.project_number && <Button variant="outlined" color="success" onClick={() => navigate(coordinator ? `/projects/${row.project_id}` : `/engineer/projects/${row.project_id}`)}>View Project</Button>}</Stack></Paper>)}</Box>}
 {listMode && <Stack direction="row" sx={{
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}><Typography variant="body2">{mode === 'projects' ? data.total_projects : data.total_surveys} assigned {mode} • Page {page}</Typography><Stack direction="row" spacing={1}><Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button><Button disabled={page * data.limit >= Number(mode === 'projects' ? data.total_projects : data.total_surveys)} onClick={() => setPage(p => p + 1)}>Next</Button></Stack></Stack>}
 {listMode && !(mode === 'projects' ? data.projects : data.surveys).length && <Alert severity="info">No assigned {mode}. Ask your coordinator to assign work to your Site Engineer account.</Alert>}
 </>}
 {resource && <>
 <Alert severity="info" sx={{
          mb: 2
        }}>Use approved drawings and record actual site evidence. Submit completed work for coordinator review.</Alert>
 <Paper elevation={0} sx={{
          ...cardSx,
          mb: 2
        }}><Stack direction={{
            xs: 'column',
            sm: 'row'
          }} useFlexGap sx={{
            gap: 2,
            justifyContent: 'space-between'
          }}><Box><Typography fontWeight={800}>Field records & evidence</Typography><Typography variant="body2" color="text.secondary">{type === 'survey' ? 'Feasible submission automatically creates the customer and project.' : 'Draft, submission and coordinator review'}</Typography></Box><Button variant="contained" startIcon={<Add />} onClick={() => setDialog({
              type: 'record',
              kind: type === 'survey' ? 'survey' : 'work_log'
            })}>Add field record</Button></Stack>{Object.entries(definitions).filter(([, d]) => d.resource === type).length > 1 && <Tabs value={kind} onChange={(_, v) => setKind(v)} variant="scrollable" scrollButtons="auto" sx={{
            mt: 2
          }}><Tab label="All records" value="all" />{Object.entries(definitions).filter(([, d]) => d.resource === type).map(([key, d]) => <Tab key={key} value={key} label={d.label} />)}</Tabs>}</Paper>
 {detail.entries.filter(e => kind === 'all' || e.kind === kind).map(e => <Paper key={e.id} elevation={0} sx={{
          ...cardSx,
          mb: 2
        }}><Stack direction="row" useFlexGap sx={{
            gap: 1,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}><Box><Typography fontWeight={800}>{definitions[e.kind]?.label} #{e.id}</Typography><Typography variant="caption" color="text.secondary">{e.author_name} • {new Date(e.created_at).toLocaleString()}</Typography></Box><Chip label={e.status} color={statusColor(e.status)} size="small" /></Stack><Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr'
            },
            gap: 1.5,
            my: 2
          }}>{definitions[e.kind]?.fields.filter(f => e.data[f.key] !== undefined && e.data[f.key] !== '').map(f => <Box key={f.key}><Typography variant="caption" color="text.secondary">{f.label}</Typography><Typography variant="body2" sx={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere'
              }}>{e.data[f.key]}</Typography></Box>)}</Box>{e.data.checks && <Stack direction="row" useFlexGap sx={{
            gap: 1,
            flexWrap: 'wrap',
            mb: 2
          }}>{Object.entries(e.data.checks).map(([label, checked]) => <Chip key={label} size="small" variant="outlined" label={label} color={checked ? 'success' : 'default'} />)}</Stack>}{e.data.rows?.length > 0 && <Box sx={{
            mb: 2
          }}>{e.data.rows.map((row, i) => <Typography key={i} variant="body2" sx={{
              py: .5,
              overflowWrap: 'anywhere'
            }}>{Object.values(row).filter(Boolean).join(' • ')}</Typography>)}</Box>}{e.review_note && <Alert severity={e.status === 'Returned' ? 'warning' : 'success'} sx={{
            mb: 1
          }}>{e.reviewer_name}: {e.review_note}</Alert>}<Stack direction="row" useFlexGap sx={{
            gap: 1,
            flexWrap: 'wrap'
          }}>{e.files.map(file => <Button key={file.id} size="small" startIcon={<DownloadOutlined />} onClick={() => download(file)} sx={{
              maxWidth: '100%',
              overflowWrap: 'anywhere'
            }}>{file.original_name}</Button>)}</Stack><Stack direction="row" useFlexGap sx={{
            gap: 1,
            flexWrap: 'wrap',
            mt: 1.5
          }}>{e.status === 'Draft' && Number(e.created_by) === Number(user.id) && <Button variant="outlined" onClick={() => setDialog({
              type: 'record',
              kind: e.kind,
              entry: e
            })}>Edit draft / attach / submit</Button>}{e.status === 'Returned' && <Button onClick={() => setDialog({
              type: 'record',
              kind: e.kind,
              source: e
            })}>Create corrected record</Button>}{coordinator && e.status === 'Submitted' && <Stack direction="row" spacing={1}><Button variant="contained" color="success" onClick={() => setDialog({
              type: 'review',
              entry: e,
              form: { decision: 'Approved', note: 'Site survey verified & approved' }
            })}>Approve & Create Project</Button><Button variant="outlined" color="error" onClick={() => setDialog({
              type: 'review',
              entry: e,
              form: { decision: 'Returned', note: '' }
            })}>Decline</Button></Stack>}</Stack></Paper>)}
 {!detail.entries.length && <Paper variant="outlined" sx={{
          ...cardSx,
          mb: 2
        }}><Typography color="text.secondary">No field records yet. Add a draft, attach site evidence and submit it for review.</Typography></Paper>}
 {detail.serials.length > 0 && <Paper sx={{
          ...cardSx,
          mb: 2
        }} variant="outlined"><Typography fontWeight={800} sx={{
            mb: 1
          }}>Registered hardware serials</Typography>{detail.serials.map((s, i) => <Typography variant="body2" key={i} sx={{
            overflowWrap: 'anywhere'
          }}>{[s.component, s.brand, s.model, s.serial].filter(Boolean).join(' • ')}</Typography>)}</Paper>}
 {type === 'survey' && <Paper variant="outlined" sx={{
          ...cardSx,
          mb: 2
        }}><Typography fontWeight={800}>Visit plan</Typography><Typography sx={{
            my: 1
          }}>{date(resource.scheduled_date)} • {time(resource.scheduled_time)} • {resource.status}</Typography><Button variant="outlined" disabled={resource.status !== 'scheduled'} onClick={() => setDialog({
            type: 'reschedule'
          })}>Reschedule / record customer confirmation</Button></Paper>}
 </>}
 {!viewingResource && !listMode && (data.pending_entries || []).length > 0 && <Paper elevation={0} sx={{
        ...cardSx,
        mb: 2
      }}><Typography fontWeight={800} sx={{
          mb: 1.5
        }}>{coordinator ? 'Field records awaiting your review' : 'Submitted records awaiting review'} ({data.pending_review_count})</Typography>{data.pending_entries.map(e => <Stack key={e.id} direction={{
          xs: 'column',
          sm: 'row'
        }} sx={{
          py: 1.5,
          gap: 1.5,
          justifyContent: 'space-between',
          alignItems: { sm: 'center' },
          borderTop: '1px solid #E2E8F0'
        }}><Box><Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={700} variant="body2">{e.customer_name} • {definitions[e.kind]?.label || 'Site survey'}</Typography><Chip label={e.status} size="small" color={e.status === 'Submitted' ? 'warning' : 'default'} />{e.feasibility_verdict && <Chip label={e.feasibility_verdict} size="small" color={e.feasibility_verdict === 'Feasible' ? 'success' : e.feasibility_verdict === 'Not feasible' ? 'error' : 'warning'} variant="outlined" />}</Stack><Typography variant="caption" color="text.secondary">{e.author_name} (Site Engineer) • Record #{e.id} {e.proposed_capacity_kw ? `• ${e.proposed_capacity_kw} kW` : ''} • {new Date(e.created_at).toLocaleString()}</Typography></Box><Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}><Button size="small" variant="outlined" onClick={() => openResource(e.resource_type, e.resource_id)}>View Details</Button>{coordinator && <><Button size="small" variant="contained" color="success" onClick={() => setDialog({
          type: 'review',
          entry: e,
          form: { decision: 'Approved', note: 'Site survey verified & approved' }
        })}>Approve & Create Project</Button><Button size="small" variant="outlined" color="error" onClick={() => setDialog({
          type: 'review',
          entry: e,
          form: { decision: 'Returned', note: '' }
        })}>Decline</Button></>}</Stack></Stack>)}<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Oldest 50 pending records shown first.</Typography></Paper>}
 {(!listMode || resource) && (!viewingResource || resource) && <Paper elevation={0} sx={{
        ...cardSx,
        mb: 2
      }}><Stack direction="row" useFlexGap sx={{
          gap: 1,
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap'
        }}><Box><Typography fontWeight={800}>{mode === 'service' ? 'Service & AMC assignments' : 'Tasks, deadlines & blockers'}</Typography><Typography variant="caption" color="text.secondary">{data.timezone} • Engineer submits work; coordinator closes the task.</Typography></Box>{coordinator && resource && <Button variant="outlined" startIcon={<Add />} onClick={() => setDialog({
            type: 'newTask'
          })}>Assign task / service visit</Button>}</Stack>{tasks.map(t => <Box key={t.id} sx={{
          borderTop: '1px solid #E2E8F0',
          py: 2
        }}><Stack direction={{
            xs: 'column',
            sm: 'row'
          }} useFlexGap sx={{
            gap: 1,
            justifyContent: 'space-between'
          }}><Box><Typography fontWeight={700}>{t.title}</Typography><Typography variant="body2" color="text.secondary">{t.customer_name || t.engineer_name} • {t.kind} • {date(t.due_date)} {time(t.due_time)}</Typography><Typography variant="body2" sx={{
                mt: .5,
                overflowWrap: 'anywhere'
              }}>{t.next_action}</Typography>{t.note && <Typography variant="body2" color="text.secondary" sx={{
                mt: .5,
                whiteSpace: 'pre-wrap'
              }}>{t.note}</Typography>}</Box><Stack direction="row" useFlexGap sx={{
              gap: 1,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}><Chip size="small" label={t.status} color={statusColor(t.status)} /><Chip size="small" label={t.priority} variant="outlined" />{!resource && <Button onClick={() => openResource(t.resource_type, t.resource_id)}>Open assignment</Button>}<Button variant="outlined" disabled={!coordinator && ['Completed', 'Cancelled'].includes(t.status)} onClick={() => setDialog({
                type: 'task',
                task: t
              })}>Update outcome</Button></Stack></Stack></Box>)}{!tasks.length && <Typography color="text.secondary">No tasks match this view.</Typography>}{!resource && <Typography variant="caption" color="text.secondary">Showing up to 300 assignments, with open work first.</Typography>}</Paper>}
 {resource && <Paper variant="outlined" sx={cardSx}><Typography fontWeight={800} sx={{
          mb: 2
        }}>Activity & scheduling history</Typography>{detail.events.map(e => <Box key={e.id} sx={{
          py: 1,
          borderTop: '1px solid #E2E8F0'
        }}><Typography variant="body2" fontWeight={700}>{e.event_type} • {e.author_name}</Typography><Typography variant="body2" sx={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere'
          }}>{e.note}</Typography><Typography variant="caption" color="text.secondary">{new Date(e.created_at).toLocaleString()}</Typography></Box>)}{!detail.events.length && <Typography color="text.secondary">No field activity recorded.</Typography>}</Paper>}
 </>}
 {dialog?.type === 'record' && resource && <RecordEditor key={dialog.entry?.id || dialog.source?.id || dialog.kind} resource={resource} resourceType={type} definitions={definitions} initialKind={dialog.kind} entry={dialog.entry} source={dialog.source} onClose={() => setDialog(null)} onSaved={refresh} user={user} />}
 {dialog && dialog.type !== 'record' && resource || dialog?.type === 'task' ? <ActionDialog key={dialog.type + (dialog.task?.id || '')} dialog={dialog} resource={resource} resourceType={type} engineers={engineers} coordinator={coordinator} onClose={() => setDialog(null)} onSaved={refresh} /> : null}
 </Box>;
}
function RecordEditor({
  resource,
  resourceType,
  definitions,
  initialKind,
  entry,
  source,
  onClose,
  onSaved,
  user
}) {
  const [kind, setKind] = useState(initialKind),
    [form, setForm] = useState(entry?.data || source?.data || {}),
    [serverId, setServerId] = useState(entry?.id || null),
    [version, setVersion] = useState(entry?.version || 1),
    [files, setFiles] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [catalog, setCatalog] = useState([]),
    [recovered, setRecovered] = useState(false),
    [dirty, setDirty] = useState(false);
  const busyRef = useRef(false),
    requestKey = useRef(crypto.randomUUID());
  const key = `solar-field-draft:${window.location.host}:${user.id}:${resourceType}:${resource.id}:${kind}:${entry?.id || 'new'}`,
    def = definitions[kind];
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({
          data: form,
          server_id: serverId,
          version,
          request_key: requestKey.current,
          saved_at: new Date().toISOString()
        }));
      } catch {/* Device draft storage is optional. */}
    }, 500);
    return () => clearTimeout(timer);
  }, [form, key, dirty, serverId, version]);
  useEffect(() => {
    api.get('/field-work/catalog').then(r => setCatalog(r.data.data)).catch(() => {});
  }, []);
  const [localDraft, setLocalDraft] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
  });
  const [consumerWarning, setConsumerWarning] = useState('');

  useEffect(() => {
    if (kind !== 'survey' || !form.consumer_number) {
      setConsumerWarning('');
      return;
    }
    const str = String(form.consumer_number).trim();
    if (str.length > 0 && (str.length < 8 || str.length > 16)) {
      setConsumerWarning('Consumer number should be between 8 and 16 characters for DISCOM feasibility.');
      return;
    }
    if (str.length >= 8) {
      const timer = setTimeout(async () => {
        try {
          const leadId = resourceType === 'survey' ? resource.lead_id : resource.id;
          const res = await api.get('/field-work/check-consumer-number', {
            params: { consumer_number: str, lead_id: leadId }
          });
          if (res.data?.exists) {
            setConsumerWarning(res.data.message || 'Consumer number already registered.');
          } else {
            setConsumerWarning('');
          }
        } catch (_) {}
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [kind, form.consumer_number, resource, resourceType]);

  const singlePhaseAbove5Kw = kind === 'survey' &&
    (form.electrical_phase === 'Single Phase' || form.electrical_phase?.toLowerCase()?.includes('single')) &&
    Number(form.proposed_capacity_kw) > 5;
  const change = (name, value) => {
    setDirty(true);
    setForm(p => ({
      ...p,
      [name]: value
    }));
  };
  const save = async submit => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    if(new TextEncoder().encode(JSON.stringify(form)).length>80*1024){setError('This record is too large. Split it into separate field records.');setBusy(false);busyRef.current=false;return;}
    let savedId = serverId,
      currentVersion = version;
    try {
      if (!savedId) {
        const r = await api.post(`/field-work/resources/${resourceType}/${resource.id}/entries`, {
          kind,
          data: form,
          request_key: requestKey.current
        });
        savedId = r.data.data.id;
        setServerId(savedId);
        if (r.status === 200) {
          currentVersion = r.data.data.version;
          await api.put(`/field-work/entries/${savedId}`, {
            data: form,
            version: currentVersion
          });
          currentVersion++;
          setVersion(currentVersion);
        }
      } else {
        await api.put(`/field-work/entries/${savedId}`, {
          data: form,
          version: currentVersion
        });
        currentVersion++;
        setVersion(currentVersion);
      }
      try {
        localStorage.setItem(key, JSON.stringify({
          data: form,
          server_id: savedId,
          version: currentVersion,
          request_key: requestKey.current,
          saved_at: new Date().toISOString()
        }));
      } catch {/* Device draft storage is optional. */}
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        await api.post(`/field-work/entries/${savedId}/files`, body, {headers:{"Content-Type":"multipart/form-data"}});
        setFiles(prev => prev.filter(v => v !== file));
      }
      if (submit) await api.post(`/field-work/entries/${savedId}/submit`, {
        version: currentVersion
      });
      localStorage.removeItem(key);
      toast.success(submit ? kind === 'survey' && form.feasibility_verdict === 'Feasible' ? 'Feasible survey saved. Customer and project linked automatically.' : 'Work submitted for review.' : 'Draft saved.');
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || 'Save/upload failed. The draft and unuploaded files remain here for retry.');
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  };
  const rows = form.rows || [],
    updateRow = (i, name, value) => change('rows', rows.map((r, n) => n === i ? {
      ...r,
      [name]: value
    } : r));
  return <Dialog open onClose={() => !busy && onClose()} fullWidth maxWidth="md" PaperProps={{
    sx: {
      borderRadius: 3,
      m: 2,
      maxWidth: 'calc(100% - 32px)',
      maxHeight: 'calc(100dvh - 32px)'
    }
  }}><DialogTitle sx={{
      fontWeight: 800
    }}>Field record<Typography variant="body2" color="text.secondary">{resource.customer_name} • Draft recovery saves text on this device.</Typography></DialogTitle><DialogContent><Stack spacing={2} sx={{
        pt: 1
      }}>{error && <Alert severity="error">{error}</Alert>}{kind === 'survey' && <><Alert severity="info">Feasible surveys create or link the customer and project automatically on submission. No manager approval is required.</Alert><SurveyDocuments surveyId={resource.id} /></>}{localDraft && !recovered && <Alert severity="info" action={<Stack direction="row"><Button onClick={() => {
            setForm(localDraft.data);
            setServerId(localDraft.server_id || entry?.id || null);
            setVersion(localDraft.version || entry?.version || 1);
            if (localDraft.request_key) requestKey.current = localDraft.request_key;
            setRecovered(true);
            setDirty(true);
          }}>Restore</Button><Button onClick={() => {
            localStorage.removeItem(key);
            setLocalDraft(null);
          }}>Discard</Button></Stack>}>A local draft is available from {new Date(localDraft.saved_at).toLocaleString()}.</Alert>}<TextField select label="Record type" value={kind} disabled={Boolean(serverId) || busy} onChange={e => {
          setKind(e.target.value);
          setForm({});
          setDirty(false);
        }}>{Object.entries(definitions).filter(([, d]) => d.resource === resourceType).map(([k, d]) => <MenuItem key={k} value={k}>{d.label}</MenuItem>)}</TextField>{source && <Alert severity="info">Correcting returned record #{source.id}. Attach current evidence; the original record stays in history.</Alert>}{def.hint && <Alert severity="info">{def.hint}</Alert>}{kind === 'survey' && <Button variant="outlined" onClick={() => {
          if (!navigator.geolocation) {
            setError('GPS is unavailable on this device.');
            return;
          }
          navigator.geolocation.getCurrentPosition(p => {
            setDirty(true);
            setForm(f => ({
              ...f,
              gps_latitude: p.coords.latitude,
              gps_longitude: p.coords.longitude
            }));
          }, () => setError('GPS permission/location unavailable. Enter coordinates manually if known.'), {
            enableHighAccuracy: true,
            timeout: 15000
          });
        }}>Capture site GPS</Button>}
        {kind === 'survey' && singlePhaseAbove5Kw && (
          <Alert severity="warning">
            ⚠️ <strong>Phase Capacity Notice:</strong> Single Phase connections typically support up to 5 kW only. Proposed capacity of {form.proposed_capacity_kw} kW requires a DISCOM phase upgrade to Three Phase.
          </Alert>
        )}
        {kind === 'survey' && consumerWarning && (
          <Alert severity="warning">
            ⚠️ {consumerWarning}
          </Alert>
        )}
        {kind === 'survey' && form.feasibility_verdict === 'Not feasible' && (
          <Alert severity="warning">
            ⚠️ Site marked as <strong>Not Feasible</strong>. Please select the specific reason and choose the action for this lead.
          </Alert>
        )}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr'
          },
          gap: 2
        }}>{def.fields
          .filter(f => {
            if (kind === 'survey' && ['not_feasible_reason', 'lead_action_on_not_feasible'].includes(f.key)) {
              return form.feasibility_verdict === 'Not feasible';
            }
            return true;
          })
          .map(f => {
            const isSelect = f.type === 'select' || (f.options && Array.isArray(f.options));
            const isMultiline = f.type === 'multiline';
            return (
              <TextField
                key={f.key}
                select={isSelect}
                label={f.label}
                required={f.required || (form.feasibility_verdict === 'Not feasible' && f.key === 'not_feasible_reason')}
                type={['number', 'date'].includes(f.type) ? f.type : 'text'}
                multiline={isMultiline}
                minRows={isMultiline ? 3 : undefined}
                value={form[f.key] ?? ''}
                onChange={e => change(f.key, e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: f.type === 'date' || undefined
                  },
                  htmlInput: {
                    maxLength: 6000,
                    step: 'any'
                  }
                }}
                sx={{
                  gridColumn: isMultiline ? '1 / -1' : undefined
                }}
              >
                {isSelect && (f.options || []).map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            );
          })}</Box>{def.checks && <Paper variant="outlined" sx={{
          p: 2,
          borderRadius: 2
        }}><Typography fontWeight={700}>Required completion checklist</Typography>{def.checks.map(c => <FormControlLabel key={c} sx={{
            display: 'flex',
            alignItems: 'flex-start',
            my: .5
          }} control={<Checkbox checked={form.checks?.[c] === true} onChange={e => change('checks', {
            ...form.checks,
            [c]: e.target.checked
          })} />} label={<Typography variant="body2" sx={{
            pt: 1
          }}>{c}</Typography>} />)}</Paper>}
 {def.rows && <Box><Typography fontWeight={700} sx={{
            mb: 1
          }}>{def.rows === 'materials' ? 'Material rows' : 'Installed component serials'}</Typography>{rows.map((row, i) => <Paper key={i} variant="outlined" sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 2
          }}><Stack direction="row" sx={{
              justifyContent: 'space-between',
              mb: 1
            }}><Typography variant="body2" fontWeight={700}>Item {i + 1}</Typography><IconButton aria-label={'Remove item ' + (i + 1)} size="small" onClick={() => change('rows', rows.filter((_, n) => n !== i))}><DeleteOutline /></IconButton></Stack><Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr'
              },
              gap: 1.5
            }}>{def.rows === 'materials' ? <><TextField select label="Inventory item (optional)" value={row.stock_id || ''} onChange={e => {
                  const item = catalog.find(c => String(c.id) === String(e.target.value));
                  change('rows', rows.map((r, n) => n === i ? {
                    ...r,
                    stock_id: item?.id || '',
                    item: item?.name || '',
                    unit: item?.unit || 'Piece'
                  } : r));
                }}><MenuItem value="">Custom item</MenuItem>{catalog.map(c => <MenuItem key={c.id} value={c.id}>{c.name} • Available {c.available_stock} {c.unit}</MenuItem>)}</TextField><TextField select label="Movement / request" value={row.movement || 'Required'} onChange={e => updateRow(i, 'movement', e.target.value)}>{['Required', 'Received', 'Used', 'Return requested', 'Damaged', 'Shortage'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField><TextField label="Item / description" value={row.item || ''} onChange={e => updateRow(i, 'item', e.target.value)} /><TextField type="number" label="Quantity" value={row.quantity || ''} onChange={e => updateRow(i, 'quantity', e.target.value)} /><TextField label="Unit" value={row.unit || 'Piece'} onChange={e => updateRow(i, 'unit', e.target.value)} /></> : <><TextField select label="Component" value={row.component || 'Panel'} onChange={e => updateRow(i, 'component', e.target.value)}>{['Panel', 'Inverter', 'Other'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>{['brand', 'model', 'serial'].map(k => <TextField key={k} label={k[0].toUpperCase() + k.slice(1)} value={row[k] || ''} onChange={e => updateRow(i, k, e.target.value)} />)}</>}</Box></Paper>)}<Button variant="outlined" startIcon={<Add />} disabled={rows.length >= 200} onClick={() => change('rows', [...rows, def.rows === 'materials' ? {
            movement: 'Required',
            unit: 'Piece'
          } : {
            component: 'Panel'
          }])}>Add item</Button></Box>}
 <Paper variant="outlined" sx={{
          p: 2,
          borderRadius: 2
        }}><Typography fontWeight={700}>Private evidence {def.evidence ? '(required for submission)' : ''}</Typography><Typography variant="body2" color="text.secondary" sx={{
            my: 1
          }}>Photos, signed acknowledgements, drawings or PDFs. Up to 20 files, 8 MB each. Files remain selected here if an upload fails; reselect them after closing the browser.</Typography>{entry?.files?.map(f => <Typography key={f.id} variant="body2">Already attached: {f.original_name}</Typography>)}<Button component="label" startIcon={<UploadFileOutlined />} variant="outlined" disabled={busy}>Choose photos / PDF<input hidden type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={e => {
              const selected = Array.from(e.target.files || []);
              if (selected.some(f => f.size > 8 * 1024 * 1024)) {
                setError('Each file must be 8 MB or smaller.');
                return;
              }
              setFiles(p => [...p, ...selected]);
              e.target.value = '';
            }} /></Button>{files.map((f, i) => <Stack key={i} direction="row" sx={{
            gap: 1,
            alignItems: 'center',
            mt: 1
          }}><Typography variant="body2" sx={{
              overflowWrap: 'anywhere',
              flex: 1
            }}>{f.name}</Typography><IconButton aria-label={'Remove file ' + f.name} size="small" disabled={busy} onClick={() => setFiles(files.filter((_, n) => n !== i))}><DeleteOutline /></IconButton></Stack>)}</Paper></Stack></DialogContent><DialogActions sx={{
      p: 2,
      gap: 1,
      flexWrap: 'wrap'
    }}><Button disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy} variant="outlined" onClick={() => save(false)}>Save draft</Button><Button disabled={busy} variant="contained" onClick={() => save(true)}>{busy ? 'Saving…' : 'Submit for review'}</Button></DialogActions></Dialog>;
}
function ActionDialog({
  dialog,
  resource,
  resourceType,
  engineers,
  coordinator,
  onClose,
  onSaved
}) {
  const t = dialog.task,
    e = dialog.entry;
  const [form, setForm] = useState(t ? {
      status: ['Completed', 'Cancelled'].includes(t.status) ? t.status : 'In progress',
      note: '',
      next_action: t.next_action,
      due_date: date(t.due_date),
      due_time: time(t.due_time)
    } : dialog.type === 'newTask' ? {
      title: '',
      assigned_to: engineers.some(e=>Number(e.id)===Number(resource?.assigned_to))?resource.assigned_to:'',
      kind: resourceType==='survey'?'Survey':'Installation',
      priority: 'Medium',
      due_date: '',
      due_time: '',
      next_action: ''
    } : dialog.type === 'reschedule' ? {
      date: date(resource?.scheduled_date),
      time: time(resource?.scheduled_time),
      confirmation: 'Unconfirmed',
      reason: ''
    } : {
      engineer_id: engineers.some(e=>Number(e.id)===Number(resource?.assigned_to))?resource.assigned_to:'',
      note: '',
      decision: 'Approved'
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const busyRef = useRef(false);
  const change = (key, value) => setForm(p => ({
    ...p,
    [key]: value
  }));
  const save = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const prefix = `/field-work/resources/${resourceType}/${resource?.id}`;
      let r;
      if (dialog.type === 'task') r = await api.patch(`/field-work/tasks/${t.id}`, {
        ...form,
        version: t.version
      });else if (dialog.type === 'review') r = await api.post(`/field-work/entries/${e.id}/review`, {
        ...form,
        version: e.version
      });else r = await api.post(prefix + '/' + {
        assignment: 'assignment',
        newTask: 'tasks',
        reschedule: 'reschedule'
      }[dialog.type], form);
      toast.success(r.data.message);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save. Please retry.');
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  };
  const field = (key, label, type = 'text', options) => options ? <TextField select key={key} label={label} value={form[key] || ''} onChange={e => change(key, e.target.value)}>{options.map(v => <MenuItem key={typeof v === 'string' ? v : v.id} value={typeof v === 'string' ? v : v.id}>{typeof v === 'string' ? v : v.full_name}</MenuItem>)}</TextField> : <TextField key={key} label={label} type={type === 'multiline' ? 'text' : type} multiline={type === 'multiline'} minRows={type === 'multiline' ? 3 : undefined} value={form[key] || ''} onChange={e => change(key, e.target.value)} slotProps={{
    inputLabel: {
      shrink: ['date', 'time'].includes(type) || undefined
    },
    htmlInput: {
      maxLength: 6000
    }
  }} />;
  return <Dialog open onClose={() => !busy && onClose()} fullWidth maxWidth="sm"><DialogTitle sx={{
      fontWeight: 800
    }}>{{
        assignment: 'Assign Site Engineer',
        newTask: 'Assign work / service visit',
        reschedule: 'Reschedule survey visit',
        review: 'Review submitted evidence',
        task: 'Task outcome & next action'
      }[dialog.type]}</DialogTitle><DialogContent><Stack spacing={2} sx={{
        pt: 1
      }}>{error && <Alert severity="error">{error}</Alert>}{['assignment','newTask'].includes(dialog.type)&&!engineers.length&&<Alert severity="info">No active Site Engineers are available. Ask your administrator to create or activate a Site Engineer account first.</Alert>}{dialog.type === 'assignment' && <>{field('engineer_id', 'Site Engineer', 'select', engineers)}{field('note', 'Assignment reason', 'multiline')}</>}{dialog.type === 'newTask' && <>{field('title', 'Task title')}{field('assigned_to', 'Site Engineer', 'select', engineers)}{field('kind', 'Task type', 'select', resourceType==='survey'?['Survey']:['Installation', 'Quality', 'Service', 'AMC', 'Inspection', 'Documents'])}{field('priority', 'Priority', 'select', ['Low', 'Medium', 'High', 'Urgent'])}{field('due_date', 'Due date', 'date')}{field('due_time', 'Exact time', 'time')}{field('next_action', 'Next action / scope', 'multiline')}</>}{dialog.type === 'reschedule' && <>{field('date', 'Visit date', 'date')}{field('time', 'Exact time', 'time')}{field('confirmation', 'Customer confirmation', 'select', ['Unconfirmed', 'Confirmed', 'Customer unavailable'])}{field('reason', 'Reason / customer discussion', 'multiline')}</>}{dialog.type === 'review' && <><Alert severity={form.decision === 'Approved' ? 'success' : 'warning'}>{form.decision === 'Approved' ? 'Approving this site survey will automatically create the Project in Pre-Install Inspection stage and assign it directly to the Site Engineer.' : 'Declining will return this survey record back to the Site Engineer with your comments for correction.'}</Alert><TextField select fullWidth label="Review Decision" value={form.decision || 'Approved'} onChange={e => change('decision', e.target.value)}><MenuItem value="Approved">Approve (Create Project & Assign to Engineer)</MenuItem><MenuItem value="Returned">Decline (Return to Engineer for Revision)</MenuItem></TextField><TextField fullWidth multiline minRows={3} label={form.decision === 'Approved' ? 'Approval Remarks / Instructions' : 'Reason for Decline / Corrections Needed'} placeholder={form.decision === 'Approved' ? 'e.g., Feasible capacity verified. Proceed with pre-install inspection.' : 'e.g., Roof measurements unclear, please re-visit and update observations.'} value={form.note || ''} onChange={e => change('note', e.target.value)} required={form.decision === 'Returned'} /></>}{dialog.type === 'task' && <>{field('status', 'Outcome status', 'select', coordinator ? ['Open', 'In progress', 'Blocked', 'Submitted', 'Completed', 'Cancelled'] : ['In progress', 'Blocked', 'Submitted'])}{field('note', 'Work outcome / blocker / rescheduling reason', 'multiline')}{field('next_action', 'Next action', 'multiline')}{field('due_date', 'Due date', 'date')}{field('due_time', 'Exact time', 'time')}<Alert severity="info">Submit the relevant field record with evidence before submitting work. A coordinator reviews evidence and closes the task.</Alert></>}</Stack></DialogContent><DialogActions sx={{
      p: 2
    }}><Button disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy} variant="contained" color={dialog.type === 'review' ? (form.decision === 'Approved' ? 'success' : 'error') : 'primary'} onClick={save}>{busy ? 'Saving…' : dialog.type === 'review' ? (form.decision === 'Approved' ? 'Approve & Create Project' : 'Decline Record') : 'Save'}</Button></DialogActions></Dialog>;
}
