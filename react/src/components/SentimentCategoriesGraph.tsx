import React, {useEffect, useState} from "react";
import {Theme, useTheme} from "@mui/material/styles";
import {Paper, Box, Typography, ButtonBase, Divider} from "@mui/material";
import {Dayjs} from "dayjs";
import {ResponsiveBar} from "@nivo/bar";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import DialogSentimentCategoriesGraph from "./DialogSentimentCategoriesGraph";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};
const ORDER: Record<string, string> = {
    Excited: "darkgreen",
    Satisfied: "green",
    Neutral: "grey",
    Unsatisfied: "orange",
    Frustrated: "red",
};

interface SentimentCategoriesGraphProps {
    fromDate: Dayjs;
    toDate: Dayjs;
    selectedProduct: string[];
    selectedSource: string[];
    isDetailed: boolean;
    setSelectedMenu?: React.Dispatch<React.SetStateAction<string>>;
}

export default function SentimentCategoriesGraph({
    fromDate,
    toDate,
    selectedProduct,
    selectedSource,
    isDetailed,
    setSelectedMenu,
}: SentimentCategoriesGraphProps) {
    const fromDate_string = fromDate.format("DD/MM/YYYY");
    const toDate_string = toDate.format("DD/MM/YYYY");

    type DataRecord = {
        sentiment_score: string;
        product: string;
        subcategory: string;
        feedback_category: string;
    };

    type Bar = {
        category: string;
        Frustrated: number;
        FrustratedColor: string;
        Unsatisfied: number;
        UnsatisfiedColor: string;
        Neutral: number;
        NeutralColor: string;
        Satisfied: number;
        SatisfiedColor: string;
        Excited: number;
        ExcitedColor: string;
    };

    const [bars, setBars] = useState<Bar[]>([]);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
    const [graphSubcategories, setGraphSubcategories] = useState<string[]>([]);

    const getColorByOrder = (
        score: number,
        order: Record<string, string>
    ): string => {
        if (score <= 1) return order["Frustrated"];
        if (score <= 2) return order["Unsatisfied"];
        if (score <= 3) return order["Neutral"];
        if (score <= 4) return order["Satisfied"];
        return order["Excited"];
    };
    const theme = useTheme();

    const convertDate = (dateString: string) => {
        const [day, month, year] = dateString.split("/");
        return new Date(`${year}-${month}-${day}`).getTime();
    };

    const formatDate = (dateString: string): string => {
        const [day, month, year] = dateString.split("/").map(Number);
        // months in JavaScript Date are zero-indexed
        const date = new Date(year, month - 1, day);
        const options: Intl.DateTimeFormatOptions = {
            day: "numeric",
            month: "short",
            year: "2-digit",
        };
        const formattedDate = new Intl.DateTimeFormat("en-GB", options).format(
            date
        );
        return formattedDate;
    };

    const handleSubcategoryChange = (event: SelectChangeEvent<string>) => {
        const {
            target: {value},
        } = event;
        setSelectedSubcategory(value);
    };

    useEffect(() => {
        const urlPrefix =
            process.env.NODE_ENV === "development"
                ? "http://localhost:3000"
                : "https://jbaaam-yl5rojgcbq-et.a.run.app";

        if (isDetailed) {
            if (!selectedSubcategory) setBars([]);
            fetch(
                `${urlPrefix}/analytics/get_sentiment_scores?fromDate=${fromDate_string}&toDate=${toDate_string}&product=${selectedProduct}&source=${selectedSource}`
            )
                .then((response) => response.json())
                .then((data: DataRecord[]) => {
                    if (data.length > 0) {
                        setGraphSubcategories(
                            Array.from(
                                new Set(
                                    data.map(({subcategory}) => subcategory)
                                )
                            )
                        );
                        const filteredSubcategories = data.filter((item) => {
                            if (item.subcategory)
                                return item.subcategory.includes(
                                    selectedSubcategory
                                );
                        });
                        const dataGroupedByFeedbackcategory: Record<
                            string,
                            DataRecord[]
                        > = filteredSubcategories.reduce((acc, curr) => {
                            const key = `${curr.subcategory} > ${curr.feedback_category}`;
                            if (!acc[key]) {
                                acc[key] = [];
                            }
                            acc[key].push(curr);
                            return acc;
                        }, {} as Record<string, DataRecord[]>);

                        const barsData: Bar[] = Object.entries(
                            dataGroupedByFeedbackcategory
                        ).map(([key, records]) => {
                            const total = records.length;
                            const sentimentScores = records.map((r) =>
                                parseFloat(r.sentiment_score)
                            );
                            const frustratedRecords = sentimentScores.filter(
                                (score) => score <= 1
                            );
                            const unsatisfiedRecords = sentimentScores.filter(
                                (score) => score <= 2 && score > 1
                            );
                            const neutralRecords = sentimentScores.filter(
                                (score) => score <= 3 && score > 2
                            );
                            const satisfiedRecords = sentimentScores.filter(
                                (score) => score <= 4 && score > 3
                            );
                            const excitedRecords = sentimentScores.filter(
                                (score) => score > 4
                            );

                            const averageScore =
                                sentimentScores.reduce(
                                    (sum, score) => sum + score,
                                    0
                                ) / total;

                            return {
                                category: key,
                                Frustrated:
                                    (100 * frustratedRecords.length) / total,
                                FrustratedColor: getColorByOrder(
                                    frustratedRecords.reduce(
                                        (sum, score) => sum + score,
                                        0
                                    ) / frustratedRecords.length || 0,
                                    ORDER
                                ),
                                Unsatisfied:
                                    (100 * unsatisfiedRecords.length) / total,
                                UnsatisfiedColor: getColorByOrder(
                                    unsatisfiedRecords.reduce(
                                        (sum, score) => sum + score,
                                        0
                                    ) / unsatisfiedRecords.length || 0,
                                    ORDER
                                ),
                                Neutral: (100 * neutralRecords.length) / total,
                                NeutralColor: getColorByOrder(
                                    neutralRecords.reduce(
                                        (sum, score) => sum + score,
                                        0
                                    ) / neutralRecords.length || 0,
                                    ORDER
                                ),
                                Satisfied:
                                    (100 * satisfiedRecords.length) / total,
                                SatisfiedColor: getColorByOrder(
                                    satisfiedRecords.reduce(
                                        (sum, score) => sum + score,
                                        0
                                    ) / satisfiedRecords.length || 0,
                                    ORDER
                                ),
                                Excited: (100 * excitedRecords.length) / total,
                                ExcitedColor: getColorByOrder(
                                    excitedRecords.reduce(
                                        (sum, score) => sum + score,
                                        0
                                    ) / excitedRecords.length || 0,
                                    ORDER
                                ),
                            };
                        });
                        console.log(barsData);
                        // Highest to lowest
                        const sortedBars = barsData.sort((a, b) => {
                            const avgA =
                                Object.values(a)
                                    .filter((_, idx) => idx % 2 === 0)
                                    .map((val) => val as number)
                                    .reduce((sum, val) => sum + val, 0) / 5;
                            const avgB =
                                Object.values(b)
                                    .filter((_, idx) => idx % 2 === 0)
                                    .map((val) => val as number)
                                    .reduce((sum, val) => sum + val, 0) / 5;
                            return avgB - avgA;
                        });
                        setBars(sortedBars);
                    } else {
                        setBars([]);
                    }
                });
        } else {
            fetch(
                `${urlPrefix}/analytics/get_sentiment_scores?fromDate=${fromDate_string}&toDate=${toDate_string}&product=${selectedProduct}&source=${selectedSource}`
            )
                .then((response) => response.json())
                .then((data: DataRecord[]) => {
                    if (data.length > 0) {
                        // [
                        //     {
                        //         subcategory: "Card>Perks",
                        //         "very angry": -29,
                        //         "very angryColor": getColorByOrder(1.1, ORDER),
                        //         sad: -11,
                        //         sadColor: "hsl(130, 70%, 50%)",
                        //         others: 24,
                        //         othersColor: "hsl(222, 70%, 50%)",
                        //         satisfied: 28,
                        //         satisfiedColor: "hsl(125, 70%, 50%)",
                        //         happy: 8,
                        //         happyColor: "hsl(289, 70%, 50%)",
                        //     },
                        // ]
                        const dataGroupedByFeedbackcategory: Record<
                            string,
                            DataRecord[]
                        > = data.reduce((acc, curr) => {
                            const key = `${curr.subcategory} > ${curr.feedback_category}`;
                            if (!acc[key]) {
                                acc[key] = [];
                            }
                            acc[key].push(curr);
                            return acc;
                        }, {} as Record<string, DataRecord[]>);

                        const barsData: Bar[] = Object.entries(
                            dataGroupedByFeedbackcategory
                        ).map(([key, records]) => {
                            const total = records.length;
                            const sentimentScores = records.map((r) =>
                                parseFloat(r.sentiment_score)
                            );
                            const frustratedRecords = sentimentScores.filter(
                                (score) => score <= 1
                            );
                            const unsatisfiedRecords = sentimentScores.filter(
                                (score) => score <= 2 && score > 1
                            );
                            const neutralRecords = sentimentScores.filter(
                                (score) => score <= 3 && score > 2
                            );
                            const satisfiedRecords = sentimentScores.filter(
                                (score) => score <= 4 && score > 3
                            );
                            const excitedRecords = sentimentScores.filter(
                                (score) => score > 4
                            );

                            const averageScore =
                                sentimentScores.reduce(
                                    (sum, score) => sum + score,
                                    0
                                ) / total;

                            return {
                                category: key,
                                Frustrated:
                                    (100 * frustratedRecords.length) / total,
                                FrustratedColor: getColorByOrder(
                                    frustratedRecords.reduce(
                                        (sum, score) => sum + score,
                                        0
                                    ) / frustratedRecords.length || 0,
                                    ORDER
                                ),
                                Unsatisfied:
                                    (100 * unsatisfiedRecords.length) / total,
                                UnsatisfiedColor: getColorByOrder(
                                    unsatisfiedRecords.reduce(
                                        (sum, score) => sum + score,
                                        0
                                    ) / unsatisfiedRecords.length || 0,
                                    ORDER
                                ),
                                Neutral: (100 * neutralRecords.length) / total,
                                NeutralColor: getColorByOrder(
                                    neutralRecords.reduce(
                                        (sum, score) => sum + score,
                                        0
                                    ) / neutralRecords.length || 0,
                                    ORDER
                                ),
                                Satisfied:
                                    (100 * satisfiedRecords.length) / total,
                                SatisfiedColor: getColorByOrder(
                                    satisfiedRecords.reduce(
                                        (sum, score) => sum + score,
                                        0
                                    ) / satisfiedRecords.length || 0,
                                    ORDER
                                ),
                                Excited: (100 * excitedRecords.length) / total,
                                ExcitedColor: getColorByOrder(
                                    excitedRecords.reduce(
                                        (sum, score) => sum + score,
                                        0
                                    ) / excitedRecords.length || 0,
                                    ORDER
                                ),
                            };
                        });
                        console.log(barsData);
                        // Highest to lowest
                        const sortedBars = barsData.sort((a, b) => {
                            const avgA =
                                Object.values(a)
                                    .filter((_, idx) => idx % 2 === 0)
                                    .map((val) => val as number)
                                    .reduce((sum, val) => sum + val, 0) / 5;
                            const avgB =
                                Object.values(b)
                                    .filter((_, idx) => idx % 2 === 0)
                                    .map((val) => val as number)
                                    .reduce((sum, val) => sum + val, 0) / 5;
                            return avgB - avgA;
                        });
                        setBars(sortedBars);
                    } else {
                        setBars([]);
                    }
                });
        }
    }, [
        fromDate,
        toDate,
        selectedProduct,
        selectedSource,
        selectedSubcategory,
    ]);

    /* Must have parent container with a defined size */
    return isDetailed ? (
        <Box
            sx={{
                display: "flex",
                gap: 2,
                width: "100%",
                flexDirection: "row",
            }}
        >
            <Paper
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    borderRadius: 4,
                    boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.3s ease-in-out",
                    "&:hover": {
                        transform: "scaleX(1.015) scaleY(1.03)",
                    },
                    flex: 1,
                }}
                id="detailed-sentimentcategoriesgraph"
            >
                <Typography
                    variant="h6"
                    component="h3"
                    sx={{marginRight: 2, width: "50%"}}
                >
                    Sentiment Categorisation
                </Typography>
                <FormControl sx={{m: 0, width: "20%"}}>
                    <InputLabel id="detailed-sentimentcategoriesgraph-filter-subcategory-label">
                        Subcategories
                    </InputLabel>
                    <Select
                        labelId="detailed-sentimentcategoriesgraph-filter-subcategory-label"
                        id="detailed-sentimentcategoriesgraph-filter-subcategory"
                        multiple={false}
                        value={selectedSubcategory}
                        onChange={handleSubcategoryChange}
                        input={
                            <OutlinedInput
                                id="detailed-sentimentcategoriesgraph-select-subcategory"
                                label="subcategory"
                                sx={{
                                    borderRadius: 4,
                                }}
                            />
                        }
                        renderValue={(selected) => (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.5,
                                }}
                            >
                                <Chip key={selected} label={selected} />
                            </Box>
                        )}
                        MenuProps={MenuProps}
                    >
                        {graphSubcategories.length > 0 ? (
                            graphSubcategories.map((subcategory: string) => (
                                <MenuItem
                                    key={subcategory}
                                    value={subcategory}
                                    className="subcategory-option"
                                >
                                    {subcategory}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>No data from selection</MenuItem>
                        )}
                    </Select>
                </FormControl>
                {/* {bars.length === 0 ? (
                    <Typography variant="body2" color="grey">
                        No data
                    </Typography>
                ) : */}
                ({" "}
                <Box
                    sx={{
                        display: "flex",
                        gap: 2,
                        mt: 2,
                        width: "100%",
                        height: 200,
                    }}
                >
                    <ResponsiveBar
                        data={bars.slice(0, 5)}
                        keys={Object.keys(ORDER)}
                        indexBy="category"
                        margin={{
                            top: 10,
                            right: 50,
                            bottom: 50,
                            left: 200,
                        }}
                        padding={0.3}
                        minValue={0}
                        maxValue={100}
                        layout="horizontal"
                        valueScale={{type: "linear"}}
                        indexScale={{type: "band", round: true}}
                        colors={{scheme: "red_yellow_blue"}}
                        defs={[
                            {
                                id: "dots",
                                type: "patternDots",
                                background: "inherit",
                                color: "#38bcb2",
                                size: 4,
                                padding: 1,
                                stagger: true,
                            },
                            {
                                id: "lines",
                                type: "patternLines",
                                background: "inherit",
                                color: "#eed312",
                                rotation: -45,
                                lineWidth: 6,
                                spacing: 10,
                            },
                        ]}
                        // fill={[
                        //     {
                        //         match: {
                        //             id: "Frustrated",
                        //         },
                        //         id: "dots",
                        //     },
                        //     {
                        //         match: {
                        //             id: "Neutral",
                        //         },
                        //         id: "lines",
                        //     },
                        // ]}
                        borderColor={{
                            from: "color",
                            modifiers: [["darker", 1.6]],
                        }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: "Percent",
                            legendPosition: "middle",
                            legendOffset: 32,
                            truncateTickAt: 0,
                        }}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: "",
                            legendPosition: "middle",
                            legendOffset: -40,
                            truncateTickAt: 0,
                        }}
                        enableGridX={true}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor={{
                            from: "color",
                            modifiers: [["darker", 1.6]],
                        }}
                        legends={[]}
                        role="application"
                        ariaLabel="Sentiment Categorisation"
                        barAriaLabel={(e) =>
                            e.id +
                            ": " +
                            e.formattedValue +
                            " for Subcategory: " +
                            e.indexValue
                        }
                    />
                </Box>
                ){/* } */}
            </Paper>
        </Box>
    ) : (
        <Box
            sx={{
                display: "flex",
                gap: 2,
                mt: 2,
                width: "100%",
                flexDirection: "column",
            }}
        >
            <DialogSentimentCategoriesGraph />;
            <ButtonBase
                component={Paper}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    borderRadius: 4,
                    flex: 1,
                    cursor: "pointer",
                    boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.1)",
                    backgroundColor:
                        theme.palette.mode === "dark" ? "#151515" : "#ffffff",
                    transition: "transform 0.3s ease-in-out",
                    "&:hover": {
                        backgroundColor:
                            theme.palette.mode === "dark"
                                ? "#1a1a1a"
                                : "#f9f9f9",
                        transform: "scaleX(1.01) scaleY(1.02)",
                    },
                }}
                id="overall-sentimentcategoriesgraph"
                onClick={() => setSelectedMenu!("analytics")}
            >
                <Box
                    sx={{
                        display: "flex",
                        width: "100%",
                        alignItems: "stretch",
                        gap: 2,
                        mt: 2,
                    }}
                >
                    <Box sx={{width: "50%"}}>
                        <Typography
                            variant="h6"
                            component="h3"
                            sx={{marginRight: 2, width: "50%"}}
                        >
                            Top 5 Positive Categories
                        </Typography>
                        {/* {bars.length === 0 ? (
                    <Typography variant="body2" color="grey">
                        No data
                    </Typography>
                ) :  */}
                        (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 2,
                                mt: 2,
                                height: 200,
                            }}
                        >
                            <ResponsiveBar
                                data={bars.slice(0, 5)}
                                keys={Object.keys(ORDER)}
                                indexBy="category"
                                margin={{
                                    top: 10,
                                    right: 50,
                                    bottom: 50,
                                    left: 200,
                                }}
                                padding={0.3}
                                minValue={0}
                                maxValue={100}
                                layout="horizontal"
                                valueScale={{type: "linear"}}
                                indexScale={{type: "band", round: true}}
                                colors={{scheme: "red_yellow_blue"}}
                                defs={[
                                    {
                                        id: "dots",
                                        type: "patternDots",
                                        background: "inherit",
                                        color: "#38bcb2",
                                        size: 4,
                                        padding: 1,
                                        stagger: true,
                                    },
                                    {
                                        id: "lines",
                                        type: "patternLines",
                                        background: "inherit",
                                        color: "#eed312",
                                        rotation: -45,
                                        lineWidth: 6,
                                        spacing: 10,
                                    },
                                ]}
                                // fill={[
                                //     {
                                //         match: {
                                //             id: "Frustrated",
                                //         },
                                //         id: "dots",
                                //     },
                                //     {
                                //         match: {
                                //             id: "Neutral",
                                //         },
                                //         id: "lines",
                                //     },
                                // ]}
                                borderColor={{
                                    from: "color",
                                    modifiers: [["darker", 1.6]],
                                }}
                                axisTop={null}
                                axisRight={null}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: "Percent",
                                    legendPosition: "middle",
                                    legendOffset: 32,
                                    truncateTickAt: 0,
                                }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: "",
                                    legendPosition: "middle",
                                    legendOffset: -40,
                                    truncateTickAt: 0,
                                }}
                                enableGridX={true}
                                labelSkipWidth={12}
                                labelSkipHeight={12}
                                labelTextColor={{
                                    from: "color",
                                    modifiers: [["darker", 1.6]],
                                }}
                                legends={[]}
                                role="application"
                                ariaLabel="Sentiment Categorisation"
                                barAriaLabel={(e) =>
                                    e.id +
                                    ": " +
                                    e.formattedValue +
                                    " for Subcategory: " +
                                    e.indexValue
                                }
                            />
                        </Box>
                    </Box>
                    ){/* } */}
                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{borderRightWidth: 2, borderColor: "black"}}
                    />
                    <Box sx={{width: "50%"}}>
                        <Typography
                            variant="h6"
                            component="h3"
                            sx={{marginRight: 2, width: "50%"}}
                        >
                            Top 5 Negative Categories
                        </Typography>
                        {/* {bars.length === 0 ? (
                    <Typography variant="body2" color="grey">
                        No data
                    </Typography>
                ) :  */}
                        (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 2,
                                mt: 2,
                                height: 200,
                            }}
                        >
                            <ResponsiveBar
                                data={bars.reverse().slice(0, 5)}
                                keys={Object.keys(ORDER)}
                                indexBy="category"
                                margin={{
                                    top: 10,
                                    right: 50,
                                    bottom: 50,
                                    left: 200,
                                }}
                                padding={0.3}
                                minValue={0}
                                maxValue={100}
                                layout="horizontal"
                                valueScale={{type: "linear"}}
                                indexScale={{type: "band", round: true}}
                                colors={{scheme: "red_yellow_blue"}}
                                defs={[
                                    {
                                        id: "dots",
                                        type: "patternDots",
                                        background: "inherit",
                                        color: "#38bcb2",
                                        size: 4,
                                        padding: 1,
                                        stagger: true,
                                    },
                                    {
                                        id: "lines",
                                        type: "patternLines",
                                        background: "inherit",
                                        color: "#eed312",
                                        rotation: -45,
                                        lineWidth: 6,
                                        spacing: 10,
                                    },
                                ]}
                                // fill={[
                                //     {
                                //         match: {
                                //             id: "Frustrated",
                                //         },
                                //         id: "dots",
                                //     },
                                //     {
                                //         match: {
                                //             id: "Neutral",
                                //         },
                                //         id: "lines",
                                //     },
                                // ]}
                                borderColor={{
                                    from: "color",
                                    modifiers: [["darker", 1.6]],
                                }}
                                axisTop={null}
                                axisRight={null}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: "Percent",
                                    legendPosition: "middle",
                                    legendOffset: 32,
                                    truncateTickAt: 0,
                                }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: "",
                                    legendPosition: "middle",
                                    legendOffset: -40,
                                    truncateTickAt: 0,
                                }}
                                enableGridX={true}
                                labelSkipWidth={12}
                                labelSkipHeight={12}
                                labelTextColor={{
                                    from: "color",
                                    modifiers: [["darker", 1.6]],
                                }}
                                legends={[]}
                                role="application"
                                ariaLabel="Sentiment Categorisation"
                                barAriaLabel={(e) =>
                                    e.id +
                                    ": " +
                                    e.formattedValue +
                                    " for Subcategory: " +
                                    e.indexValue
                                }
                            />
                        </Box>
                    </Box>
                    ){/* } */}
                </Box>
            </ButtonBase>
        </Box>
    );
}
