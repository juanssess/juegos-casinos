/**
 * Resultado del QA. Lo escribe `npm run qa -- --game famatina`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "819db7d7b0a60992",
  "rounds": 120000000,
  "targetRtp": 0.97,
  "rtp": 0.9699999999999999,
  "rtpCi": 0,
  "rtpBase": 0.97,
  "rtpFeature": 0,
  "hitFrequency": 0.6698325333333334,
  "triggerOneIn": 0,
  "freeSpinsPerTrigger": 0,
  "stdDev": 0.6812876223827921,
  "volatilityIndex": 1.120718138819693,
  "volatilityLabel": "baja",
  "maxWinX": 10000,
  "maxObservedX": 9007.67,
  "buy": [],
  "ante": null,
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP exacto en las 256 configuraciones: la más lejos del objetivo es \"1 minas, 1 casillas\" con 97,000 % (objetivo 97,00 %, tolerancia ±0,20)"
    },
    {
      "id": "motor",
      "level": "error",
      "ok": true,
      "msg": "el motor paga lo que dice la fórmula: la mayor diferencia es \"3 minas, 16 casillas\", 95,05 % simulado contra 97,000 % exacto (2.7 desvíos; máximo 4,5)"
    },
    {
      "id": "tope",
      "level": "warn",
      "ok": true,
      "msg": "premio máximo 10.000× (los originales del mercado: de 1.000× para arriba)"
    }
  ],
  "passed": true,
  "original": [
    {
      "label": "1 minas, 1 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.969743146672358,
      "simCi": 0.0005685922613977568,
      "n": 468750
    },
    {
      "label": "1 minas, 2 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9697491626618068,
      "simCi": 0.0008200273002693531,
      "n": 468750
    },
    {
      "label": "1 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9701874559929539,
      "simCi": 0.001024851602007054,
      "n": 468750
    },
    {
      "label": "1 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9704176853329917,
      "simCi": 0.0012109153788035232,
      "n": 468750
    },
    {
      "label": "1 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.9711206613355089,
      "simCi": 0.0013860190451531042,
      "n": 468750
    },
    {
      "label": "1 minas, 6 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9696913493401811,
      "simCi": 0.0015610618613090947,
      "n": 468750
    },
    {
      "label": "1 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.97222670933124,
      "simCi": 0.0017285741202409317,
      "n": 468750
    },
    {
      "label": "1 minas, 8 casillas",
      "exact": 0.97,
      "sim": 0.9689805653298532,
      "simCi": 0.0019061090957086912,
      "n": 468750
    },
    {
      "label": "1 minas, 9 casillas",
      "exact": 0.97,
      "sim": 0.9686707626702177,
      "simCi": 0.0020837962842852093,
      "n": 468750
    },
    {
      "label": "1 minas, 10 casillas",
      "exact": 0.97,
      "sim": 0.9702661759965179,
      "simCi": 0.002267203626846756,
      "n": 468750
    },
    {
      "label": "1 minas, 11 casillas",
      "exact": 0.97,
      "sim": 0.971117098663636,
      "simCi": 0.0024610823764227813,
      "n": 468750
    },
    {
      "label": "1 minas, 12 casillas",
      "exact": 0.97,
      "sim": 0.9707791146632397,
      "simCi": 0.00266785609934202,
      "n": 468750
    },
    {
      "label": "1 minas, 13 casillas",
      "exact": 0.97,
      "sim": 0.971728192002776,
      "simCi": 0.0028904660909522826,
      "n": 468750
    },
    {
      "label": "1 minas, 14 casillas",
      "exact": 0.97,
      "sim": 0.9676289706699686,
      "simCi": 0.0031319278187451507,
      "n": 468750
    },
    {
      "label": "1 minas, 15 casillas",
      "exact": 0.97,
      "sim": 0.9695781973314229,
      "simCi": 0.003400727215297683,
      "n": 468750
    },
    {
      "label": "1 minas, 16 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9696022186683153,
      "simCi": 0.00370216401575949,
      "n": 468750
    },
    {
      "label": "1 minas, 17 casillas",
      "exact": 0.97,
      "sim": 0.9712893866695334,
      "simCi": 0.004049377726522544,
      "n": 468750
    },
    {
      "label": "1 minas, 18 casillas",
      "exact": 0.97,
      "sim": 0.9688588586664995,
      "simCi": 0.00445130947481963,
      "n": 468750
    },
    {
      "label": "1 minas, 19 casillas",
      "exact": 0.97,
      "sim": 0.9691005653315625,
      "simCi": 0.004939919941783696,
      "n": 468750
    },
    {
      "label": "1 minas, 20 casillas",
      "exact": 0.97,
      "sim": 0.9670615466651826,
      "simCi": 0.005547441635982885,
      "n": 468750
    },
    {
      "label": "1 minas, 21 casillas",
      "exact": 0.97,
      "sim": 0.9670443519999887,
      "simCi": 0.006354800179915176,
      "n": 468750
    },
    {
      "label": "1 minas, 22 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9692758400006564,
      "simCi": 0.0075174045289778686,
      "n": 468750
    },
    {
      "label": "1 minas, 23 casillas",
      "exact": 0.97,
      "sim": 0.9736991573333351,
      "simCi": 0.009433235762209174,
      "n": 468750
    },
    {
      "label": "1 minas, 24 casillas",
      "exact": 0.97,
      "sim": 0.9752250666666666,
      "simCi": 0.013638939528244458,
      "n": 468750
    },
    {
      "label": "2 minas, 1 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9703492693284885,
      "simCi": 0.0008174240406474843,
      "n": 468750
    },
    {
      "label": "2 minas, 2 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9698577706726993,
      "simCi": 0.0011972621120503227,
      "n": 468750
    },
    {
      "label": "2 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9701461760044777,
      "simCi": 0.0015174000272108548,
      "n": 468750
    },
    {
      "label": "2 minas, 4 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9711718400050721,
      "simCi": 0.0018164787684552177,
      "n": 468750
    },
    {
      "label": "2 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.9682691626718712,
      "simCi": 0.002114262981551563,
      "n": 468750
    },
    {
      "label": "2 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.9699624106710267,
      "simCi": 0.002411901145823585,
      "n": 468750
    },
    {
      "label": "2 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.9689027626688077,
      "simCi": 0.002721961194371575,
      "n": 468750
    },
    {
      "label": "2 minas, 8 casillas",
      "exact": 0.97,
      "sim": 0.9677977173376784,
      "simCi": 0.0030487777936532142,
      "n": 468750
    },
    {
      "label": "2 minas, 9 casillas",
      "exact": 0.97,
      "sim": 0.9723461759980728,
      "simCi": 0.0034023236660386457,
      "n": 468750
    },
    {
      "label": "2 minas, 10 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9733037653354889,
      "simCi": 0.003787203399906102,
      "n": 468750
    },
    {
      "label": "2 minas, 11 casillas",
      "exact": 0.97,
      "sim": 0.9733295786686379,
      "simCi": 0.0042123892956260475,
      "n": 468750
    },
    {
      "label": "2 minas, 12 casillas",
      "exact": 0.97,
      "sim": 0.9668539519986403,
      "simCi": 0.00467980435903231,
      "n": 468750
    },
    {
      "label": "2 minas, 13 casillas",
      "exact": 0.97,
      "sim": 0.9675720533316835,
      "simCi": 0.005223985278819001,
      "n": 468750
    },
    {
      "label": "2 minas, 14 casillas",
      "exact": 0.97,
      "sim": 0.9639979519986726,
      "simCi": 0.005846712831391976,
      "n": 468750
    },
    {
      "label": "2 minas, 15 casillas",
      "exact": 0.97,
      "sim": 0.9713858133325656,
      "simCi": 0.006614183254050376,
      "n": 468750
    },
    {
      "label": "2 minas, 16 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.977949610667342,
      "simCi": 0.007546359708921063,
      "n": 468750
    },
    {
      "label": "2 minas, 17 casillas",
      "exact": 0.97,
      "sim": 0.9743924266675233,
      "simCi": 0.008672475762807906,
      "n": 468750
    },
    {
      "label": "2 minas, 18 casillas",
      "exact": 0.97,
      "sim": 0.9726447146660252,
      "simCi": 0.010134353915108921,
      "n": 468750
    },
    {
      "label": "2 minas, 19 casillas",
      "exact": 0.97,
      "sim": 0.9655923200003692,
      "simCi": 0.012078052868901025,
      "n": 468750
    },
    {
      "label": "2 minas, 20 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.971676159999749,
      "simCi": 0.014966426990760501,
      "n": 468750
    },
    {
      "label": "2 minas, 21 casillas",
      "exact": 0.97,
      "sim": 0.971552,
      "simCi": 0.019453389058653455,
      "n": 468750
    },
    {
      "label": "2 minas, 22 casillas",
      "exact": 0.97,
      "sim": 0.9845888,
      "simCi": 0.027834495215850467,
      "n": 468750
    },
    {
      "label": "2 minas, 23 casillas",
      "exact": 0.97,
      "sim": 1.0268032,
      "simCi": 0.04939784077725277,
      "n": 468750
    },
    {
      "label": "3 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9693425493262907,
      "simCi": 0.0010276833380233664,
      "n": 468750
    },
    {
      "label": "3 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9684844373378022,
      "simCi": 0.00152045856779466,
      "n": 468750
    },
    {
      "label": "3 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.970382421337999,
      "simCi": 0.0019503651570642899,
      "n": 468750
    },
    {
      "label": "3 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9682076799969193,
      "simCi": 0.002372293395005828,
      "n": 468750
    },
    {
      "label": "3 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.9708938880036952,
      "simCi": 0.002801158123714969,
      "n": 468750
    },
    {
      "label": "3 minas, 6 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9699693653306437,
      "simCi": 0.003254469807249265,
      "n": 468750
    },
    {
      "label": "3 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.9710901333313627,
      "simCi": 0.003745745579657247,
      "n": 468750
    },
    {
      "label": "3 minas, 8 casillas",
      "exact": 0.97,
      "sim": 0.9672480213361414,
      "simCi": 0.004282540100935633,
      "n": 468750
    },
    {
      "label": "3 minas, 9 casillas",
      "exact": 0.97,
      "sim": 0.9703701759986461,
      "simCi": 0.004895469650506576,
      "n": 468750
    },
    {
      "label": "3 minas, 10 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9683058986670795,
      "simCi": 0.005588096527672666,
      "n": 468750
    },
    {
      "label": "3 minas, 11 casillas",
      "exact": 0.97,
      "sim": 0.9676365866671641,
      "simCi": 0.006397776118165281,
      "n": 468750
    },
    {
      "label": "3 minas, 12 casillas",
      "exact": 0.97,
      "sim": 0.9701334826657584,
      "simCi": 0.0073693607948452115,
      "n": 468750
    },
    {
      "label": "3 minas, 13 casillas",
      "exact": 0.97,
      "sim": 0.9607853440009017,
      "simCi": 0.008502037538607236,
      "n": 468750
    },
    {
      "label": "3 minas, 14 casillas",
      "exact": 0.97,
      "sim": 0.9773325013337698,
      "simCi": 0.010023559952588757,
      "n": 468750
    },
    {
      "label": "3 minas, 15 casillas",
      "exact": 0.97,
      "sim": 0.9753339946669973,
      "simCi": 0.011866426134107301,
      "n": 468750
    },
    {
      "label": "3 minas, 16 casillas",
      "exact": 0.97,
      "sim": 0.9504770346665816,
      "simCi": 0.014123846946256983,
      "n": 468750
    },
    {
      "label": "3 minas, 17 casillas",
      "exact": 0.97,
      "sim": 0.9658320853335421,
      "simCi": 0.017541344656357632,
      "n": 468750
    },
    {
      "label": "3 minas, 18 casillas",
      "exact": 0.97,
      "sim": 0.9955450453332667,
      "simCi": 0.022626302381657627,
      "n": 468750
    },
    {
      "label": "3 minas, 19 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9345212799999368,
      "simCi": 0.029106365601979274,
      "n": 468750
    },
    {
      "label": "3 minas, 20 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9633160533333015,
      "simCi": 0.041877425246935086,
      "n": 468750
    },
    {
      "label": "3 minas, 21 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9185770666666667,
      "simCi": 0.06474483044941981,
      "n": 468750
    },
    {
      "label": "3 minas, 22 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.8805013333333334,
      "simCi": 0.12685702065680912,
      "n": 468750
    },
    {
      "label": "4 minas, 1 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9714488959996946,
      "simCi": 0.0012081231606176023,
      "n": 468750
    },
    {
      "label": "4 minas, 2 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9677338240050475,
      "simCi": 0.0018207364134129585,
      "n": 468750
    },
    {
      "label": "4 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9698121173302346,
      "simCi": 0.002371574770498096,
      "n": 468750
    },
    {
      "label": "4 minas, 4 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9712815786630745,
      "simCi": 0.0029305873265836617,
      "n": 468750
    },
    {
      "label": "4 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.968471488002437,
      "simCi": 0.0035234333884801862,
      "n": 468750
    },
    {
      "label": "4 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.9674058239981863,
      "simCi": 0.004174825748304591,
      "n": 468750
    },
    {
      "label": "4 minas, 7 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9667799466680981,
      "simCi": 0.004910360619496636,
      "n": 468750
    },
    {
      "label": "4 minas, 8 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9716295039996287,
      "simCi": 0.005772097216687397,
      "n": 468750
    },
    {
      "label": "4 minas, 9 casillas",
      "exact": 0.97,
      "sim": 0.9662212906659867,
      "simCi": 0.006762858503864022,
      "n": 468750
    },
    {
      "label": "4 minas, 10 casillas",
      "exact": 0.97,
      "sim": 0.9683039573326992,
      "simCi": 0.007978256529977811,
      "n": 468750
    },
    {
      "label": "4 minas, 11 casillas",
      "exact": 0.97,
      "sim": 0.9647318186670526,
      "simCi": 0.00944936946626727,
      "n": 468750
    },
    {
      "label": "4 minas, 12 casillas",
      "exact": 0.97,
      "sim": 0.9665018453328722,
      "simCi": 0.011326034950718822,
      "n": 468750
    },
    {
      "label": "4 minas, 13 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9652187093331323,
      "simCi": 0.01372784508866437,
      "n": 468750
    },
    {
      "label": "4 minas, 14 casillas",
      "exact": 0.97,
      "sim": 0.9738665386665819,
      "simCi": 0.016999897308844172,
      "n": 468750
    },
    {
      "label": "4 minas, 15 casillas",
      "exact": 0.97,
      "sim": 0.9862528853332463,
      "simCi": 0.0215478885499735,
      "n": 468750
    },
    {
      "label": "4 minas, 16 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9438285866667318,
      "simCi": 0.027312599271518943,
      "n": 468750
    },
    {
      "label": "4 minas, 17 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9707945599999589,
      "simCi": 0.0372413253815148,
      "n": 468750
    },
    {
      "label": "4 minas, 18 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9797703253333525,
      "simCi": 0.052983055665862824,
      "n": 468750
    },
    {
      "label": "4 minas, 19 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9353942186666716,
      "simCi": 0.07914434973132685,
      "n": 468750
    },
    {
      "label": "4 minas, 20 casillas",
      "exact": 0.97,
      "sim": 0.8795494399999979,
      "simCi": 0.13297924026105584,
      "n": 468750
    },
    {
      "label": "5 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9692687786688009,
      "simCi": 0.0013900826169085923,
      "n": 468750
    },
    {
      "label": "5 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9709069013385846,
      "simCi": 0.0021121811544244007,
      "n": 468750
    },
    {
      "label": "5 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9686301013370066,
      "simCi": 0.0028010974346056017,
      "n": 468750
    },
    {
      "label": "5 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9709218773357876,
      "simCi": 0.003525116080071711,
      "n": 468750
    },
    {
      "label": "5 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.970164821334797,
      "simCi": 0.004326159193671405,
      "n": 468750
    },
    {
      "label": "5 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.9696268373323995,
      "simCi": 0.005245403688909694,
      "n": 468750
    },
    {
      "label": "5 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.9675413973342324,
      "simCi": 0.00632638529270056,
      "n": 468750
    },
    {
      "label": "5 minas, 8 casillas",
      "exact": 0.97,
      "sim": 0.9657720320004604,
      "simCi": 0.007633761178890373,
      "n": 468750
    },
    {
      "label": "5 minas, 9 casillas",
      "exact": 0.97,
      "sim": 0.9807343359993577,
      "simCi": 0.009324621179820915,
      "n": 468750
    },
    {
      "label": "5 minas, 10 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9719915306661971,
      "simCi": 0.011356217407663422,
      "n": 468750
    },
    {
      "label": "5 minas, 11 casillas",
      "exact": 0.97,
      "sim": 0.9719190826664934,
      "simCi": 0.014046455808588388,
      "n": 468750
    },
    {
      "label": "5 minas, 12 casillas",
      "exact": 0.97,
      "sim": 0.9787286399998136,
      "simCi": 0.01770147888556912,
      "n": 468750
    },
    {
      "label": "5 minas, 13 casillas",
      "exact": 0.97,
      "sim": 0.9554825386667506,
      "simCi": 0.02240669321990534,
      "n": 468750
    },
    {
      "label": "5 minas, 14 casillas",
      "exact": 0.97,
      "sim": 0.9540350933332682,
      "simCi": 0.029406087628299837,
      "n": 468750
    },
    {
      "label": "5 minas, 15 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9380116053333556,
      "simCi": 0.03955913438119319,
      "n": 468750
    },
    {
      "label": "5 minas, 16 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9633162240000119,
      "simCi": 0.05675816954232919,
      "n": 468750
    },
    {
      "label": "5 minas, 17 casillas",
      "exact": 0.97,
      "sim": 0.9443376426666636,
      "simCi": 0.08435054605303617,
      "n": 468750
    },
    {
      "label": "5 minas, 18 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.8219598933333317,
      "simCi": 0.12855356659709716,
      "n": 468750
    },
    {
      "label": "5 minas, 19 casillas",
      "exact": 0.97,
      "sim": 1.1544086399999987,
      "simCi": 0.28504680571680135,
      "n": 468750
    },
    {
      "label": "6 minas, 1 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9707062400068679,
      "simCi": 0.001559289371114805,
      "n": 468750
    },
    {
      "label": "6 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9705944746710168,
      "simCi": 0.002411635248579333,
      "n": 468750
    },
    {
      "label": "6 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9706740906639871,
      "simCi": 0.003254826129459043,
      "n": 468750
    },
    {
      "label": "6 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9695903359981789,
      "simCi": 0.00417746919678907,
      "n": 468750
    },
    {
      "label": "6 minas, 5 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9708318506657317,
      "simCi": 0.005247763277265787,
      "n": 468750
    },
    {
      "label": "6 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.9738876800006958,
      "simCi": 0.00653923468209695,
      "n": 468750
    },
    {
      "label": "6 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.9772022400002403,
      "simCi": 0.008141489888614647,
      "n": 468750
    },
    {
      "label": "6 minas, 8 casillas",
      "exact": 0.97,
      "sim": 0.968225792000294,
      "simCi": 0.010122266599017356,
      "n": 468750
    },
    {
      "label": "6 minas, 9 casillas",
      "exact": 0.97,
      "sim": 0.9717553066670122,
      "simCi": 0.012771171494216466,
      "n": 468750
    },
    {
      "label": "6 minas, 10 casillas",
      "exact": 0.97,
      "sim": 0.9800100480001513,
      "simCi": 0.01636452108283822,
      "n": 468750
    },
    {
      "label": "6 minas, 11 casillas",
      "exact": 0.97,
      "sim": 0.965684565333461,
      "simCi": 0.021097150949807183,
      "n": 468750
    },
    {
      "label": "6 minas, 12 casillas",
      "exact": 0.97,
      "sim": 0.9858196906665716,
      "simCi": 0.028299040547689665,
      "n": 468750
    },
    {
      "label": "6 minas, 13 casillas",
      "exact": 0.97,
      "sim": 0.9629985706666389,
      "simCi": 0.0382058340470373,
      "n": 468750
    },
    {
      "label": "6 minas, 14 casillas",
      "exact": 0.97,
      "sim": 1.0034539733333494,
      "simCi": 0.055223186836625075,
      "n": 468750
    },
    {
      "label": "6 minas, 15 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9947287466666713,
      "simCi": 0.08161295457840595,
      "n": 468750
    },
    {
      "label": "6 minas, 16 casillas",
      "exact": 0.97,
      "sim": 0.9336484906666688,
      "simCi": 0.12506432013174892,
      "n": 468750
    },
    {
      "label": "6 minas, 17 casillas",
      "exact": 0.97,
      "sim": 0.9161973333333333,
      "simCi": 0.21461676534732135,
      "n": 468750
    },
    {
      "label": "7 minas, 1 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9708740906646156,
      "simCi": 0.0017304870920378118,
      "n": 468750
    },
    {
      "label": "7 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9714446080021667,
      "simCi": 0.002721819619495929,
      "n": 468750
    },
    {
      "label": "7 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9721086506646914,
      "simCi": 0.00374663755416931,
      "n": 468750
    },
    {
      "label": "7 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9693386666681045,
      "simCi": 0.004914789812196341,
      "n": 468750
    },
    {
      "label": "7 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.9690029866675657,
      "simCi": 0.006330240276406074,
      "n": 468750
    },
    {
      "label": "7 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.9702312320002384,
      "simCi": 0.008115803698686894,
      "n": 468750
    },
    {
      "label": "7 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.9739104426669682,
      "simCi": 0.01044851017111835,
      "n": 468750
    },
    {
      "label": "7 minas, 8 casillas",
      "exact": 0.97,
      "sim": 0.980046997333007,
      "simCi": 0.013590364225809797,
      "n": 468750
    },
    {
      "label": "7 minas, 9 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9946423680001285,
      "simCi": 0.018003800051083627,
      "n": 468750
    },
    {
      "label": "7 minas, 10 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9703045333334319,
      "simCi": 0.023842984620353176,
      "n": 468750
    },
    {
      "label": "7 minas, 11 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9857432106666043,
      "simCi": 0.03300922304612879,
      "n": 468750
    },
    {
      "label": "7 minas, 12 casillas",
      "exact": 0.9700000000000001,
      "sim": 1.0219730986666313,
      "simCi": 0.047615805371963645,
      "n": 468750
    },
    {
      "label": "7 minas, 13 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9934730239999902,
      "simCi": 0.06917627468770028,
      "n": 468750
    },
    {
      "label": "7 minas, 14 casillas",
      "exact": 0.97,
      "sim": 1.045972266666663,
      "simCi": 0.11001469452320445,
      "n": 468750
    },
    {
      "label": "7 minas, 15 casillas",
      "exact": 0.97,
      "sim": 0.9532814506666656,
      "simCi": 0.17421077533730564,
      "n": 468750
    },
    {
      "label": "8 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9693391146631916,
      "simCi": 0.0019056849339737375,
      "n": 468750
    },
    {
      "label": "8 minas, 2 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9712729813377027,
      "simCi": 0.0030497191666246015,
      "n": 468750
    },
    {
      "label": "8 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9696605440028372,
      "simCi": 0.004285634471105821,
      "n": 468750
    },
    {
      "label": "8 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9655239893329625,
      "simCi": 0.005758125535729549,
      "n": 468750
    },
    {
      "label": "8 minas, 5 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9682611200004643,
      "simCi": 0.007642307452260959,
      "n": 468750
    },
    {
      "label": "8 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.9631611306669585,
      "simCi": 0.010097731886469312,
      "n": 468750
    },
    {
      "label": "8 minas, 7 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9730966613330164,
      "simCi": 0.013544176531160653,
      "n": 468750
    },
    {
      "label": "8 minas, 8 casillas",
      "exact": 0.97,
      "sim": 0.9700120533332723,
      "simCi": 0.018312973239599357,
      "n": 468750
    },
    {
      "label": "8 minas, 9 casillas",
      "exact": 0.97,
      "sim": 0.9489917866667278,
      "simCi": 0.02503218602959007,
      "n": 468750
    },
    {
      "label": "8 minas, 10 casillas",
      "exact": 0.97,
      "sim": 0.9550778240000151,
      "simCi": 0.035617935923293244,
      "n": 468750
    },
    {
      "label": "8 minas, 11 casillas",
      "exact": 0.97,
      "sim": 0.9867786453333056,
      "simCi": 0.05307837443445895,
      "n": 468750
    },
    {
      "label": "8 minas, 12 casillas",
      "exact": 0.97,
      "sim": 0.9164721493333289,
      "simCi": 0.07820342371945337,
      "n": 468750
    },
    {
      "label": "8 minas, 13 casillas",
      "exact": 0.9699999999999999,
      "sim": 1.0806369066666708,
      "simCi": 0.1369702259836167,
      "n": 468750
    },
    {
      "label": "8 minas, 14 casillas",
      "exact": 0.97,
      "sim": 1.0987228799999984,
      "simCi": 0.23925675273711441,
      "n": 468750
    },
    {
      "label": "9 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9705044053368974,
      "simCi": 0.002082317749372079,
      "n": 468750
    },
    {
      "label": "9 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9695158826647493,
      "simCi": 0.0034007202769321433,
      "n": 468750
    },
    {
      "label": "9 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9690817919986551,
      "simCi": 0.00489327591008182,
      "n": 468750
    },
    {
      "label": "9 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9696708479993132,
      "simCi": 0.0067728868835463096,
      "n": 468750
    },
    {
      "label": "9 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.9741640533326996,
      "simCi": 0.00929615161718718,
      "n": 468750
    },
    {
      "label": "9 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.980860906667018,
      "simCi": 0.012828003920252917,
      "n": 468750
    },
    {
      "label": "9 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.9671650346667889,
      "simCi": 0.017759505591200937,
      "n": 468750
    },
    {
      "label": "9 minas, 8 casillas",
      "exact": 0.97,
      "sim": 0.9889898026667345,
      "simCi": 0.025547927304123117,
      "n": 468750
    },
    {
      "label": "9 minas, 9 casillas",
      "exact": 0.97,
      "sim": 0.9719045546666192,
      "simCi": 0.03704077315709902,
      "n": 468750
    },
    {
      "label": "9 minas, 10 casillas",
      "exact": 0.97,
      "sim": 0.9401223680000065,
      "simCi": 0.05516665703021486,
      "n": 468750
    },
    {
      "label": "9 minas, 11 casillas",
      "exact": 0.97,
      "sim": 0.9755989333333249,
      "simCi": 0.08891853004017415,
      "n": 468750
    },
    {
      "label": "9 minas, 12 casillas",
      "exact": 0.97,
      "sim": 1.0229009280000034,
      "simCi": 0.1524005154229544,
      "n": 468750
    },
    {
      "label": "9 minas, 13 casillas",
      "exact": 0.97,
      "sim": 1.1914134186666656,
      "simCi": 0.2965473111337406,
      "n": 468750
    },
    {
      "label": "10 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.970441023996508,
      "simCi": 0.002267068006895839,
      "n": 468750
    },
    {
      "label": "10 minas, 2 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.971956437335485,
      "simCi": 0.0037860186903365526,
      "n": 468750
    },
    {
      "label": "10 minas, 3 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.967901589333741,
      "simCi": 0.005587192257863308,
      "n": 468750
    },
    {
      "label": "10 minas, 4 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.967801749332696,
      "simCi": 0.00797642041464261,
      "n": 468750
    },
    {
      "label": "10 minas, 5 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.974006485332861,
      "simCi": 0.011367282948856777,
      "n": 468750
    },
    {
      "label": "10 minas, 6 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9772297600001502,
      "simCi": 0.016341991471322224,
      "n": 468750
    },
    {
      "label": "10 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.9693773653334311,
      "simCi": 0.023831748891122214,
      "n": 468750
    },
    {
      "label": "10 minas, 8 casillas",
      "exact": 0.97,
      "sim": 1.01420610133335,
      "simCi": 0.03669724673864243,
      "n": 468750
    },
    {
      "label": "10 minas, 9 casillas",
      "exact": 0.97,
      "sim": 0.9722203946666735,
      "simCi": 0.05609824608863766,
      "n": 468750
    },
    {
      "label": "10 minas, 10 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9910850560000033,
      "simCi": 0.09256285387881372,
      "n": 468750
    },
    {
      "label": "10 minas, 11 casillas",
      "exact": 0.97,
      "sim": 1.0744259413333377,
      "simCi": 0.16697841177106695,
      "n": 468750
    },
    {
      "label": "11 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9695995946636434,
      "simCi": 0.0024616021818290156,
      "n": 468750
    },
    {
      "label": "11 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.969913066668632,
      "simCi": 0.004208242929880028,
      "n": 468750
    },
    {
      "label": "11 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9651897173338282,
      "simCi": 0.006391189425407428,
      "n": 468750
    },
    {
      "label": "11 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9641315840003853,
      "simCi": 0.0094466870101672,
      "n": 468750
    },
    {
      "label": "11 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.9540179626664985,
      "simCi": 0.013921539775490616,
      "n": 468750
    },
    {
      "label": "11 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.9745933440001296,
      "simCi": 0.02119256338158579,
      "n": 468750
    },
    {
      "label": "11 minas, 7 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9669035093332728,
      "simCi": 0.03269454277301723,
      "n": 468750
    },
    {
      "label": "11 minas, 8 casillas",
      "exact": 0.97,
      "sim": 0.9606930559999735,
      "simCi": 0.05237406897009859,
      "n": 468750
    },
    {
      "label": "11 minas, 9 casillas",
      "exact": 0.97,
      "sim": 0.9270301653333259,
      "simCi": 0.08667906471213638,
      "n": 468750
    },
    {
      "label": "11 minas, 10 casillas",
      "exact": 0.97,
      "sim": 0.9798225280000035,
      "simCi": 0.15946020183696302,
      "n": 468750
    },
    {
      "label": "12 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9702753493299168,
      "simCi": 0.002667953495622319,
      "n": 468750
    },
    {
      "label": "12 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9665846186653021,
      "simCi": 0.004679384635164384,
      "n": 468750
    },
    {
      "label": "12 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.970947477332423,
      "simCi": 0.007372006247759608,
      "n": 468750
    },
    {
      "label": "12 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.970676053332868,
      "simCi": 0.011349006863409353,
      "n": 468750
    },
    {
      "label": "12 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.964121962666486,
      "simCi": 0.017572188320765698,
      "n": 468750
    },
    {
      "label": "12 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.9659581013332411,
      "simCi": 0.028015322386929796,
      "n": 468750
    },
    {
      "label": "12 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.9228483839999739,
      "simCi": 0.04525599842894571,
      "n": 468750
    },
    {
      "label": "12 minas, 8 casillas",
      "exact": 0.97,
      "sim": 0.9477743359999957,
      "simCi": 0.07952618480977008,
      "n": 468750
    },
    {
      "label": "12 minas, 9 casillas",
      "exact": 0.97,
      "sim": 1.1293298133333376,
      "simCi": 0.16012962357478977,
      "n": 468750
    },
    {
      "label": "13 minas, 1 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9690688426694133,
      "simCi": 0.002890166063302243,
      "n": 468750
    },
    {
      "label": "13 minas, 2 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9685137493316729,
      "simCi": 0.00522581545343161,
      "n": 468750
    },
    {
      "label": "13 minas, 3 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9687882666675802,
      "simCi": 0.008533643147219617,
      "n": 468750
    },
    {
      "label": "13 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9794454613331187,
      "simCi": 0.013824524720731986,
      "n": 468750
    },
    {
      "label": "13 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.9531217920000836,
      "simCi": 0.022379397498697398,
      "n": 468750
    },
    {
      "label": "13 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.9947294933333034,
      "simCi": 0.03882686774172187,
      "n": 468750
    },
    {
      "label": "13 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.947002133333324,
      "simCi": 0.06754166866518511,
      "n": 468750
    },
    {
      "label": "13 minas, 8 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9947285333333369,
      "simCi": 0.13141573495886502,
      "n": 468750
    },
    {
      "label": "13 minas, 9 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9608173866666659,
      "simCi": 0.26631078754249515,
      "n": 468750
    },
    {
      "label": "14 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9729192106699958,
      "simCi": 0.003133739146515435,
      "n": 468750
    },
    {
      "label": "14 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9657282773319973,
      "simCi": 0.005850800069413912,
      "n": 468750
    },
    {
      "label": "14 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9814898346671126,
      "simCi": 0.010043211543733147,
      "n": 468750
    },
    {
      "label": "14 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9783096746665821,
      "simCi": 0.017037596286810525,
      "n": 468750
    },
    {
      "label": "14 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.9495135999999353,
      "simCi": 0.029336921869662403,
      "n": 468750
    },
    {
      "label": "14 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.9931413120000148,
      "simCi": 0.05493943552625092,
      "n": 468750
    },
    {
      "label": "14 minas, 7 casillas",
      "exact": 0.97,
      "sim": 0.9826710399999968,
      "simCi": 0.10663612557179532,
      "n": 468750
    },
    {
      "label": "14 minas, 8 casillas",
      "exact": 0.9700000000000001,
      "sim": 1.0580294399999985,
      "simCi": 0.23478502097478934,
      "n": 468750
    },
    {
      "label": "15 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9710072106647444,
      "simCi": 0.003401564666944143,
      "n": 468750
    },
    {
      "label": "15 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9767395626659157,
      "simCi": 0.006629157828620706,
      "n": 468750
    },
    {
      "label": "15 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9605403093336551,
      "simCi": 0.011781034082785559,
      "n": 468750
    },
    {
      "label": "15 minas, 4 casillas",
      "exact": 0.97,
      "sim": 0.9702961066665802,
      "simCi": 0.02137581851555925,
      "n": 468750
    },
    {
      "label": "15 minas, 5 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9689870293333566,
      "simCi": 0.04020392351423516,
      "n": 468750
    },
    {
      "label": "15 minas, 6 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.909217066666671,
      "simCi": 0.07803030468709818,
      "n": 468750
    },
    {
      "label": "15 minas, 7 casillas",
      "exact": 0.97,
      "sim": 1.019596650666665,
      "simCi": 0.18016686799895162,
      "n": 468750
    },
    {
      "label": "16 minas, 1 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9714619733349933,
      "simCi": 0.00370375804603164,
      "n": 468750
    },
    {
      "label": "16 minas, 2 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9721191893339933,
      "simCi": 0.007526909158098064,
      "n": 468750
    },
    {
      "label": "16 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9689480319999126,
      "simCi": 0.014255277976292073,
      "n": 468750
    },
    {
      "label": "16 minas, 4 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9710455680000678,
      "simCi": 0.027699711292068215,
      "n": 468750
    },
    {
      "label": "16 minas, 5 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9720414720000128,
      "simCi": 0.057014011441943034,
      "n": 468750
    },
    {
      "label": "16 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.8682059946666683,
      "simCi": 0.12060355442404243,
      "n": 468750
    },
    {
      "label": "17 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9738597973362082,
      "simCi": 0.00405221145633489,
      "n": 468750
    },
    {
      "label": "17 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9726795093341927,
      "simCi": 0.008665609394327204,
      "n": 468750
    },
    {
      "label": "17 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9620923946668741,
      "simCi": 0.01750819286374057,
      "n": 468750
    },
    {
      "label": "17 minas, 4 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9640632746666267,
      "simCi": 0.03711270469574382,
      "n": 468750
    },
    {
      "label": "17 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.9639701759999981,
      "simCi": 0.08522192683203036,
      "n": 468750
    },
    {
      "label": "17 minas, 6 casillas",
      "exact": 0.97,
      "sim": 0.98164,
      "simCi": 0.22214827235824677,
      "n": 468750
    },
    {
      "label": "18 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9695135359998253,
      "simCi": 0.004452242773067503,
      "n": 468750
    },
    {
      "label": "18 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.964368682666033,
      "simCi": 0.01009439389664241,
      "n": 468750
    },
    {
      "label": "18 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9623637759999357,
      "simCi": 0.022251912321452915,
      "n": 468750
    },
    {
      "label": "18 minas, 4 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.94087874133335,
      "simCi": 0.05192372703455022,
      "n": 468750
    },
    {
      "label": "18 minas, 5 casillas",
      "exact": 0.97,
      "sim": 0.9685514666666637,
      "simCi": 0.1395427227224897,
      "n": 468750
    },
    {
      "label": "19 minas, 1 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9735446399982108,
      "simCi": 0.004947663905318938,
      "n": 468750
    },
    {
      "label": "19 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9686549333337062,
      "simCi": 0.01209618703173187,
      "n": 468750
    },
    {
      "label": "19 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9764045866665991,
      "simCi": 0.029745827295216902,
      "n": 468750
    },
    {
      "label": "19 minas, 4 casillas",
      "exact": 0.97,
      "sim": 1.0209057920000073,
      "simCi": 0.08267850918670978,
      "n": 468750
    },
    {
      "label": "19 minas, 5 casillas",
      "exact": 0.97,
      "sim": 1.136084693333332,
      "simCi": 0.2827757818987822,
      "n": 468750
    },
    {
      "label": "20 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9718623999984929,
      "simCi": 0.005557755385604978,
      "n": 468750
    },
    {
      "label": "20 minas, 2 casillas",
      "exact": 0.9699999999999999,
      "sim": 0.9787532799997433,
      "simCi": 0.015018941703338456,
      "n": 468750
    },
    {
      "label": "20 minas, 3 casillas",
      "exact": 0.97,
      "sim": 0.9518933333333026,
      "simCi": 0.04162946999223823,
      "n": 468750
    },
    {
      "label": "20 minas, 4 casillas",
      "exact": 0.97,
      "sim": 1.083730559999996,
      "simCi": 0.14760338094867237,
      "n": 468750
    },
    {
      "label": "21 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.967189866666647,
      "simCi": 0.006355149636001533,
      "n": 468750
    },
    {
      "label": "21 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9572736,
      "simCi": 0.01931281203248211,
      "n": 468750
    },
    {
      "label": "21 minas, 3 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9947285333333333,
      "simCi": 0.06737051816971294,
      "n": 468750
    },
    {
      "label": "22 minas, 1 casillas",
      "exact": 0.9700000000000001,
      "sim": 0.9656900906673143,
      "simCi": 0.007505382277605526,
      "n": 468750
    },
    {
      "label": "22 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9450645333333333,
      "simCi": 0.02727570632811769,
      "n": 468750
    },
    {
      "label": "22 minas, 3 casillas",
      "exact": 0.97,
      "sim": 1.1375125333333334,
      "simCi": 0.1441791852459122,
      "n": 468750
    },
    {
      "label": "23 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9660408746666661,
      "simCi": 0.00939928229357332,
      "n": 468750
    },
    {
      "label": "23 minas, 2 casillas",
      "exact": 0.97,
      "sim": 0.9454784,
      "simCi": 0.04740793697458527,
      "n": 468750
    },
    {
      "label": "24 minas, 1 casillas",
      "exact": 0.97,
      "sim": 0.9648266666666667,
      "simCi": 0.01356906171494561,
      "n": 468750
    }
  ]
};
