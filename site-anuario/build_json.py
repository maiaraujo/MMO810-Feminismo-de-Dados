import pandas as pd, json
X='/mnt/user-data/uploads/Dados_dos_Relatórios_-_Preencher.xlsx'
nomes={'FCA':'Ciências Aplicadas','FCF':'Ciências Farmacêuticas','FCM':'Ciências Médicas','FE':'Educação','FEA':'Engenharia de Alimentos','FEAGRI':'Engenharia Agrícola','FECFAU':'Arquitetura e Urbanismo, Engenharia Civil','FEEC':'Engenharia Elétrica','FEF':'Educação Física','FEM':'Engenharia Mecânica','FENF':'Enfermagem','FEQ':'Engenharia Química','FOP':'Odontologia','FT':'Tecnologia','IA':'Artes','IB':'Biologia','IC':'Computação','IE':'Economia','IEL':'Estudos da Linguagem','IFCH':'Filosofia e Ciências Humanas','IFGW':'Física','IG':'Geociências','IMECC':'Matemática, Estatística e Computação Científica','IQ':'Química'}
def yrs(df): return [c for c in df.columns if str(c).split('.')[0].isdigit()]
def y(c): return str(int(float(c)))
g=pd.read_excel(X,sheet_name='Alunos - Gênero').dropna(how='all')
alunos={}
for _,r in g.iterrows():
    for c in yrs(g):
        if pd.notna(r[c]): alunos.setdefault(r['Unidade'],{}).setdefault(y(c),{})[r['Gênero']]=int(r[c])
d=pd.read_excel(X,sheet_name='Docentes - Gênero').dropna(how='all')
doc={}
for _,r in d.iterrows():
    for c in yrs(d):
        if pd.notna(r[c]):
            reg='TOTAL' if r['Regime de Trabalho'].startswith('Total') else r['Regime de Trabalho']
            doc.setdefault(r['Unidade'],{}).setdefault(y(c),{}).setdefault(reg,{})[r['Sexo']]=int(r[c])
rc=pd.read_excel(X,sheet_name='Alunos - RaçaCor').dropna(how='all')
raca={}
for _,r in rc.iterrows():
    for c in yrs(rc):
        if pd.notna(r[c]): raca.setdefault(y(c),{})[r['Raça/Cor']]=round(float(r[c]),4)
p=pd.read_excel(X,sheet_name='Alunos - PCD').dropna(how='all')
pcd={}
for _,r in p.iterrows():
    for c in yrs(p):
        if pd.notna(r[c]): pcd.setdefault(r['Unidade'],{})[y(c)]=int(r[c])
dr=pd.read_excel(X,sheet_name='Docentes - RaçaCor').dropna(how='all')
docraca={}
for _,r in dr.iterrows():
    cat='Não Declarado' if r['Raça/Cor'].startswith('Não') else r['Raça/Cor']
    for c in yrs(dr):
        if pd.notna(r[c]): docraca.setdefault(r['Unidade'],{}).setdefault(y(c),{})[cat]=int(r[c])
# total Unicamp = soma dos institutos
docraca['UNICAMP']={}
for u in list(docraca):
    if u=='UNICAMP': continue
    for ano,cats in docraca[u].items():
        for k,v in cats.items():
            t=docraca['UNICAMP'].setdefault(ano,{}); t[k]=t.get(k,0)+v
pc=lambda v:f'{v*100:.1f}'.replace('.',',')+'%'
def pp(u,ano='2025'):
    d=docraca[u][ano]; t=sum(d.values()); return t,d['Branca']/t,(d['Preta']+d['Parda'])/t
def nota_raca(u,nome):
    t,b,pp_=pp(u)
    return f'{nome}: {pc(b)} dos docentes são brancos; pretos e pardos somam {pc(pp_)} ({t} docentes). Bla bla bla.'
a25=raca['2025']
unidades={}
for s,n in nomes.items():
    a=alunos[s]['2025']; pct=a['F']/(a['F']+a['M'])
    unidades[s]={'nome':n,'grupo':'cuidado' if pct>=.5 else 'logica'}
nota_unicamp=f"Somando os institutos, {pc(pp('UNICAMP')[1])} dos docentes são brancos; pretos e pardos somam {pc(pp('UNICAMP')[2])}, contra {pc(a25['Preta']+a25['Parda'])} entre os alunos. Bla bla bla."

# ---------- helpers dos textos (todos os números vêm do Excel) ----------
n=lambda v:f'{v:,}'.replace(',','.')                 # 1289 -> 1.289
pp1=lambda v:f'{v:.1f}'.replace('.',',')             # pontos percentuais
def al(s,ano='2025'):
    a=alunos[s][ano]; t=a['F']+a['M']; return a['F'],t,a['F']/t
def dc(s,ano='2025'):
    d=doc[s][ano]['TOTAL']; t=d['F']+d['M']; return d['F'],t,d['F']/t
def AL(s): f,t,p=al(s); return pc(p),n(f),n(t)       # (%, mulheres, total) alunos
def DC(s): f,t,p=dc(s); return pc(p),n(f),n(t)       # (%, mulheres, total) docentes
asc_a=sorted(alunos,key=lambda s:al(s)[2]); asc_d=sorted(doc,key=lambda s:dc(s)[2])   # do menor p/ o maior % de mulheres
min_a=[s for s in asc_a if al(s)[2]<.5]; maj_d=[s for s in asc_d if dc(s)[2]>=.5]; min_d=[s for s in asc_d if dc(s)[2]<.5]
# confere as afirmações de ranking do roteiro: se algum dado mudar, o script avisa
assert asc_a[:3]==['IC','FEM','FEEC'] and asc_a[-2:]==['FCF','FENF']
assert min_a[-1]=='FCA' and asc_a[len(min_a)]=='IFCH'
assert asc_d[:3]==['FEEC','FEM','IC'] and asc_d[-1]=='FENF'
assert min_d[-1]=='FCM' and maj_d[0]=='IEL'
def cmp(s):
    a=al(s)[2]; d=dc(s)[2]
    return f'{s}: as mulheres são {pc(a)} dos alunos e {pc(d)} dos docentes ({pp1(abs(d-a)*100)} pontos percentuais {"a menos" if d<a else "a mais"} entre os docentes).'

# ---------- alunos por gênero (roteiro) ----------
p,f,t=AL('IC'); ic=[f'O IC é o instituto com menor número de alunas matriculadas: somente {p}, equivalente a {f} de {t} estudantes.',
  'Vale ressaltar que, em 2025, na primeira chamada de aprovados no vestibular pela Convest, dos 103 alunos listados havia a mesma quantidade de mulheres, Gabrieis e Joãos: exatamente 6 de cada.']
p,f,t=AL('FENF'); fenf=[f'No extremo oposto, a enfermagem tem {p} de alunas: {f} de {t} alunos.',
  'É notável a relação: mulheres concentradas em áreas ligadas ao cuidado (saúde e educação) e homens em áreas de lógica e construção (engenharias e exatas). Os dados mostram essa relação na grande maioria das unidades.']
p,f,t=AL('FEM'); fem=[f'A engenharia mecânica é a segunda com menor presença feminina: somente {p}, ou {f} dos {t} alunos.',
  'Aqui começa-se a notar um padrão: áreas de exatas são vinculadas a maior presença masculina, enquanto áreas de saúde e humanas têm maior presença feminina.']
p,f,t=AL('FCF'); fcf=[f'O curso de farmácia também está vinculado a maior presença feminina, com {p} de mulheres, equivalente a {f} dos {t} alunos, logo atrás da enfermagem.',
  'Pelo padrão identificado, continuam-se reforçando as diferenças por gênero em cada área do conhecimento.']
p,f,t=AL('FEEC'); feec=[f'Com quase nenhuma diferença percentual para a mecânica, a engenharia elétrica tem {p} de mulheres matriculadas: {f} de {t}.',
  'Mantém-se o padrão: as engenharias estão entre as áreas com mais presença masculina.']
p,f,t=AL('FE'); fe=[f'Mantendo-se também o padrão de que cursos de humanas têm mais presença feminina, a educação tem {p} de mulheres matriculadas ({f} de {t}).']
p,f,t=AL('FCA'); fca=[f'A FCA é a unidade com minoria de mulheres que mais se aproxima da igualdade: {p} ({f} de {t}).',
  f'Das {len(min_a)} unidades com minoria de mulheres, a grande maioria é de exatas, tecnologia e engenharias, áreas vinculadas a profissões tidas como masculinas. As exceções mais claras são a Educação Física (FEF, {pc(al("FEF")[2])}) e a Economia (IE, {pc(al("IE")[2])}).']
p,f,t=AL('IFCH'); ifch=[f'Ordenando do menor para o maior percentual, o IFCH é o primeiro em que as mulheres ultrapassam a metade dos matriculados: {p} ({f} de {t}).',
  f'Acima do IFCH estão, em sua maioria, unidades de humanas, artes e saúde, com poucas exceções, como a Engenharia de Alimentos (FEA), onde {pc(al("FEA")[2])} são mulheres.']
ASC=True   # True: menor -> maior % de mulheres | False: maior -> menor
notas_al={'IC':ic,'FENF':fenf,'FEM':fem,'FCF':fcf,'FEEC':feec,'FE':fe,'FCA':fca,'IFCH':ifch}

# ---------- docentes por gênero (roteiro) ----------
p,f,t=DC('FEEC'); d_feec=[f'Com apenas {p} do corpo docente composto por mulheres, a FEEC é o instituto com menos professoras: {f} entre {t} docentes.',cmp('FEEC')]
p,f,t=DC('FENF'); d_fenf=[f'No caminho oposto, a enfermagem tem {p} de professoras mulheres: {f} entre {t}.',cmp('FENF')]
p,f,t=DC('FEM'); d_fem=[f'Em segundo lugar de menos mulheres docentes, a engenharia mecânica está com {p}, referente a {f} mulheres entre {t} docentes.',cmp('FEM'),
  'Nota-se, assim como entre os discentes, um padrão: engenharias e exatas ainda são dominadas e entendidas como espaços masculinos.']
p,f,t=DC('FE'); d_fe=[f'A educação, entre os docentes, também tem maioria feminina: {p} ({f} de {t}).',cmp('FE'),
  'Seguindo o mesmo padrão, as áreas de saúde, cuidado e educação são vinculadas à atuação feminina, com maior presença de mulheres.']
p,f,t=DC('FCM'); d_fcm=[f'A FCM está no limiar: ainda tem maioria masculina, mas é a que mais se aproxima do equilíbrio, com {p} de mulheres no corpo docente ({f} de {t}).',cmp('FCM'),
  f'Mesmo com quase equilíbrio entre docentes homens e mulheres, abaixo dela há outros {len(min_d)-1} institutos e faculdades com mais homens que mulheres na docência.']
p,f,t=DC('IEL'); d_iel=[f'O IEL é o primeiro instituto, do menor para o maior percentual, em que as mulheres passam de 50%: {p} de docentes mulheres, {f} dos {t} docentes.',cmp('IEL'),
  f'Diferente da medicina, que ainda tem outros {len(min_d)-1} institutos abaixo com minoria de mulheres docentes, acima do IEL há somente outros {len(maj_d)-1} ({", ".join(reversed(maj_d[1:]))}) com mais da metade do corpo docente composto por mulheres.',
  'Entre as docentes fica claro que há a questão de área, mas ela é reforçada por uma questão de poder: a queda do percentual de mulheres da graduação para a docência sugere que a docência ainda dá preferência a homens, mesmo em ambientes entendidos como femininos.']
p,f,t=DC('IC'); d_ic=[f'Em terceiro lugar de menos mulheres docentes, o IC tem {p} de professoras: {f} mulheres entre {t} docentes.',cmp('IC'),
  'O IC, que já é o instituto com menos alunas, também está entre os três com menor presença feminina na docência: nas áreas de computação, a ausência de mulheres se repete de quem estuda para quem ensina.']
notas_dc={'IC':d_ic,'FEEC':d_feec,'FENF':d_fenf,'FEM':d_fem,'FE':d_fe,'FCM':d_fcm,'IEL':d_iel}

# ---------- alunos por raça/cor (roteiro) ----------
rp=lambda a:raca[str(a)]['Preta']+raca[str(a)]['Parda']
nd=lambda a:raca[str(a)]['Não Declarado']
pcd_i=pcd['Subtotal Institutos']
notas_raca={
 2013:[f'Em 2013, três anos antes da greve de 2016 (de junho a agosto), que resultou na conquista de cotas étnico-raciais e de escola pública nos cursos da Unicamp, pretos e pardos eram {pc(rp(2013))} dos alunos e {pc(nd(2013))} não tinham raça/cor declarada.',
       'Não há dados da Unicamp sobre a divisão étnico-racial por instituto, somente para a universidade como um todo.'],
 2017:[f'Ano seguinte à greve. Só em novembro os órgãos deliberativos da Unicamp aprovaram a implementação das cotas, a valer a partir do vestibular do ano seguinte. Pretos e pardos eram {pc(rp(2017))} dos alunos.',
       'Foi também o ano em que se aprovou o vestibular indígena, processo próprio de ingresso na universidade.'],
 2019:[f'Primeiro ano com ingressantes pelo vestibular indígena e também com cotas de escola pública e étnico-raciais. Pretos e pardos chegam a {pc(rp(2019))} dos alunos; indígenas, a {pc(raca["2019"]["Indígena"])}.',
       'Não há informação sobre a porcentagem de alunos de escola pública que ingressaram na universidade.'],
 2025:[f'Com o último dado disponível, 9 anos após a greve e 6 após a primeira turma com cotas, o perfil da sala de aula é outro: pretos e pardos somam {pc(rp(2025))}, indígenas {pc(raca["2025"]["Indígena"])}, e os não declarados caíram para {pc(nd(2025))} (eram {pc(nd(2013))} em 2013).',
       f'Em setembro de 2024 foram aprovadas as cotas PCD, implementadas a partir de 2025. Nos institutos, o número de alunos com deficiência matriculados passou de {n(pcd_i["2024"])} em 2024 para {n(pcd_i["2025"])} em 2025.',
       'Em abril de 2025 também foram aprovadas as cotas trans, com alunes entrando por esse meio a partir de 2026, mas nenhum dado da Unicamp trata de pessoas trans. Espera-se que os dados de 2026, ainda não disponíveis, tragam essa representação.']}

out={'meta':{'titulo':'Mulheres na Unicamp','ano_base':2025,'fonte':'Dados_dos_Relatórios - Preencher.xlsx','obs':'Gênero de alunos: 2022-2025. Docentes: 2020-2025 (carreira MS). Raça/cor de alunos: 2013-2025 (só UNICAMP geral, sem recorte por instituto). Raça/cor de docentes: 2023-2025, por instituto (todos os docentes ativos).'},
 'unidades':unidades,
 'paginas':{
  'barras':{'titulo':'% de alunas em 2025 por gênero','ano':2025,'caixa_cuidado':'Áreas de cuidado','caixa_logica':'Áreas de lógica'},
  'genero':{'titulo':'Alunos por instituto – Gênero – 2025','ano':2025,'slides':[{'unidade':u,'nota':notas_al[u]} for u in sorted(notas_al,key=lambda u:al(u)[2],reverse=not ASC)]},
  'raca':{'titulo':'Alunos por raça/cor','slides':[
    {'rotulo':'Antes da greve','ano':2013,'nota':notas_raca[2013]},
    {'rotulo':'Cotas aprovadas','ano':2017,'nota':notas_raca[2017]},
    {'rotulo':'1ª turma com cotas','ano':2019,'nota':notas_raca[2019]},
    {'rotulo':'Hoje','ano':2025,'nota':notas_raca[2025]}]},
  'barras-prof':{'titulo':'% de docentes mulheres em 2025 por instituto','ano':2025,'caixa_cuidado':'Áreas de cuidado','caixa_logica':'Áreas de lógica',
    'sub':'Docentes ativos da carreira MS, todos os regimes de trabalho, ordenados da maior para a menor % de mulheres.'},
  'lousa':{'titulo':'Docentes por instituto – Gênero – 2025','ano':2025,'slides':[{'unidade':u,'nota':notas_dc[u]} for u in sorted(notas_dc,key=lambda u:dc(u)[2],reverse=not ASC)]},
  'raca-prof':{'titulo':'Docentes por instituto – Raça/cor – 2025','ano':2025,
    'sub':'Docentes ativos. Os relatórios trazem raça/cor de docentes apenas de 2023 a 2025.',
    'slides':[{'unidade':'UNICAMP','rotulo':'Unicamp','nota':nota_unicamp}]+[{'unidade':u,'rotulo':u,'nota':nota_raca(u,u)} for u in ['IC','IA','FENF']]}},
 'cores_raca':{'Branca':'#8b97ad','Parda':'#b5651d','Preta':'#272b40','Amarela':'#f2b705','Indígena':'#F38686','Não Declarado':'#2F80ED'},
 'dados':{'alunos_genero':alunos,'docentes_genero':doc,'alunos_raca_unicamp':raca,'alunos_pcd':pcd,'docentes_raca':docraca}}
json.dump(out,open('data/data.json','w'),ensure_ascii=False,indent=1)
print(len(json.dumps(out)), out['dados']['alunos_raca_unicamp']['2018'], doc['IC']['2025'])